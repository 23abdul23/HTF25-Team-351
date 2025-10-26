import express from "express";
import multer from "multer";
import Capsule from "../models/Capsule.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { uploadBuffer, getSignedUrl, getFilesUrls } from "../services/azureBlob.js";
import { verifyJwt } from "../lib/jwt.js";
import axios from "axios";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

let TOKEN = ""
// Enhanced token middleware that extracts userId from Bearer JWT or cookie / fallback token
function requireToken(req, res, next) {
  // Try Bearer token first
  const authHeader = req.get("authorization") || req.get("Authorization") || "";
  let token;

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();

  } else if (req.cookies && req.cookies.token) {
    // httpOnly cookie set by server
    token = req.cookies.token;
  } else {
    // legacy/static token header or query param
    token = req.header("x-api-token") || req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: token required" });
  }

  TOKEN = token


  try {
    const payload = verifyJwt(token);
    // JWT should include sub as user id

    req.userId = payload && payload.sub;
    if (!req.userId) {
      return res.status(400).json({ error: "Invalid token payload" });
    }
    return next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * POST /api/capsules
 * JSON flow (SAS): { title, description, unlockDate, recipients, visibility, blobs: [...] }
 */
router.post("/", requireToken, express.json(), async (req, res) => {
  try {
    const { title, description, unlockDate, recipients, visibility, blobs } =
      req.body;


    console.log("Create capsule:", req.body);


    if (!Array.isArray(blobs) || blobs.length === 0) {
      return res.status(400).json({ error: "blobs array required" });
    }

    // Validate recipients array
    const recipientList = Array.isArray(recipients) ? recipients : [];

    // Validate blobs entries
    const savedFiles = [];
    for (const b of blobs) {
      if (!b || typeof b.blobName !== "string") continue;
      // Ensure blobName matches our naming convention: /^\d+_.+/ or userId prefix
      if (!/^\d+_.+/.test(b.blobName) && !b.blobName.includes("/")) continue;
      savedFiles.push({
        originalName:
          b.originalName || b.blobName.split("_").slice(1).join("_"),
        blobName: b.blobName,
        contentType: b.contentType || "application/octet-stream",
        size: b.size || 0,
        url: b.url || null,
      });
    }

    if (!savedFiles.length)
      return res.status(400).json({ error: "No valid blobs provided" });

    const capsule = await Capsule.create({
      title: title || savedFiles.map((s) => s.originalName).join(", "),
      description,
      createdBy: req.userId,
      recipients: recipientList,
      visibility: visibility || "private", // private, shared, or public
      files: savedFiles,
      unlockDate: unlockDate ? new Date(unlockDate) : new Date(),
    });

    res.json({ ok: true, id: capsule._id });
  } catch (err) {
    console.error("Create capsule (SAS) error", err);
    res.status(500).json({ error: "Failed to create capsule" });
  }
});

/**
 * POST /api/capsules/upload
 * multipart/form-data with files -> server uploads to Azure and stores metadata
 */
router.post(
  "/upload",
  requireToken,
  upload.array("files", 20),
  async (req, res) => {
    try {
      const { title, description, unlockDate, recipients, visibility , userId} =
        req.body;
      if (!req.files || !req.files.length)
        return res.status(400).json({ error: "No files uploaded" });

      // Parse recipients if sent as JSON string
      const recipientList = recipients
        ? typeof recipients === "string"
          ? JSON.parse(recipients)
          : recipients
        : [];

      const savedFiles = [];
      for (const f of req.files) {
        // Use userId in the blob path for organization
        const safeName = `${userId}/${Date.now()}_${f.originalname.replace(/\s+/g, "_")}`;
        const meta = await uploadBuffer(f.buffer, safeName, f.mimetype);
        savedFiles.push({
          originalName: f.originalname,
          blobName: meta.name,
          contentType: f.mimetype,
          size: meta.size,
          url: meta.url || null,
        });
      }

      const capsule = await Capsule.create({
        title: title || savedFiles.map((s) => s.originalName).join(", "),
        description,
        userId : userId,
        createdBy: userId,
        recipients: recipientList,
        visibility: visibility || "private",
        files: savedFiles,
        unlockDate: unlockDate ? new Date(unlockDate) : new Date(),
      });

      console.log("Capsule created with uploaded files:", capsule._id);

      res.json({ ok: true, id: capsule._id });
    } catch (err) {
      console.error("Create capsule (multipart) error", err);
      res.status(500).json({ error: "Failed to upload files" });
    }
  },
);
//community route 
router.post(
  "/community/create",
  requireToken,
  upload.array("files", 20),
  async (req, res) => {
    try {
      console.log("community create body:", req.body);

      // prefer req.userId from requireToken middleware
      const creatorId = req.body.userId;
      const { title, description, unlockDate, lockDate, recipients, visibility } = req.body;

      if (!req.files || !req.files.length)
        return res.status(400).json({ error: "No files uploaded" });

      // Parse recipients (emails) if sent as JSON string
      const recipientEmails = recipients
        ? typeof recipients === "string"
          ? JSON.parse(recipients)
          : recipients
        : [];

        
      // resolve recipient users
      const recipientUsers = recipientEmails.length
      ? await User.find({ email: { $in: recipientEmails } }).lean()
      : [];
      
      const recipientIds = recipientUsers.map((u) => String(u._id));
      
      console.log("Creator ID:", creatorId);
      console.log("Parsed recipient emails:", recipientEmails);
      console.log("Resolved recipient IDs:", recipientIds);


        // fetch creator email for sharedWith entries
      const creatorUser = await User.findById(creatorId).lean();
      const creatorEmail = creatorUser?.email || null;
      const idToEmail = new Map(recipientUsers.map((u) => [String(u._id), u.email]));

      // Upload files to storage (use creatorId path)
      const savedFiles = [];
      for (const f of req.files) {
        const safeName = `${title}/${Date.now()}_${f.originalname.replace(/\s+/g, "_")}`;
        const meta = await uploadBuffer(f.buffer, safeName, f.mimetype);
        savedFiles.push({
          originalName: f.originalname,
          blobName: meta.name,
          contentType: f.mimetype,
          size: meta.size,
          url: meta.url || null,
        });
      }

      // create a single sharedCapsuleId that will be set on all created docs
      const sharedId = new mongoose.Types.ObjectId().toString();

      // parse dates
      const parsedUnlock = unlockDate ? new Date(unlockDate) : null;
      const parsedLock = lockDate ? new Date(lockDate) : null;

      // Base capsule fields (include lockDate)
      const baseCapsule = {
        title: title || savedFiles.map((s) => s.originalName).join(", "),
        description,
        recipients: recipientEmails,
        visibility: visibility || "shared",
        files: savedFiles,
        unlockDate: parsedUnlock,
        lockDate: parsedLock,
        communityCapusule: true,
        sharedCapsuleId: sharedId,
      };

      const createdIds = [];

      // Create capsule for creator
      const creatorDoc = {
        ...baseCapsule,
        createdBy: creatorId,
        sharedWith: recipientIds, // recipients that can access
      };
      const createdForCreator = await Capsule.create(creatorDoc);
      createdIds.push(String(createdForCreator._id));

      // Create capsules for each recipient user (so capsule appears in their list)
      for (const rid of recipientIds) {
        if (rid === creatorId) continue; // skip creator if in list

        const recipientEmail = idToEmail.get(rid);
        const otherRecipientEmails = recipientEmails.filter((e) => e !== recipientEmail);
        const sharedWith = [creatorEmail, ...otherRecipientEmails].filter(Boolean);

        const recipientDoc = {
          ...baseCapsule,
          createdBy: rid,
          sharedWith,
        };
        const c = await Capsule.create(recipientDoc);
        createdIds.push(String(c._id));
      }

      console.log("Community capsule created, sharedId:", sharedId, "createdIds:", createdIds);

      res.json({ ok: true, sharedCapsuleId: sharedId, createdCapsuleIds: createdIds });
    } catch (err) {
      console.error("Create community capsule error", err);
      res.status(500).json({ error: "Failed to upload community capsule" });
    }
  },
);

/**
 * GET /api/capsules  (list metadata - only accessible capsules)
 */
  router.get("/", requireToken, async (req, res) => {
    try {
      console.log("Listing all capsules metadata...");
      console.log(req.query)

      const items = await Capsule.find({createdBy: req.query.userId}).sort({createdAt: -1 }).lean();


      // For each capsule, attach fileUrl to each file using getFilesUrls
      const itemsWithFileUrls = await Promise.all(
        items.map(async (item) => {
          const files = item.files || [];
          const filesWithUrl = await Promise.all(
            files.map(async (f) => {
              try {
                const url = await axios.get(`http://localhost:5000/api/sas/get-sas`, {
                  headers: {
                    Authorization: `Bearer ${TOKEN}`,
                  },
                  params: {
                    blobName: f.blobName,
                  },
                });

                return { ...f, fileUrl: url.data.sasUrl };
              } catch (err) {
                console.error("Failed to get URL for blob:", f.blobName, err);
                return { ...f, fileUrl: null };
              }
            })
          );
          return { ...item, files: filesWithUrl };
        })
      );

      res.status(200).json({ data: itemsWithFileUrls });
    } catch (err) {
      console.error("List capsules error:", err);
      res.status(500).json({ error: "Failed to list capsules" });
    }
  });


//community capsule get route
router.get("/community", requireToken, async (req, res) => {
  try {
    console.log("Listing all capsules metadata...");
    console.log(req.query)
    const userId = req.query.userId;

    const items = await Capsule.find({ createdBy: userId})
      .sort({ createdAt: -1 })
      .lean();

    
    console.log("community capsules: ", items)

    // For each capsule, attach fileUrl to each file using getFilesUrls
    const itemsWithFileUrls = await Promise.all(
      items.map(async (item) => {
        const files = item.files || [];
        const filesWithUrl = await Promise.all(
          files.map(async (f) => {
            try {
              const url = await axios.get(`http://localhost:5000/api/sas/get-sas`, {
                headers: {
                  Authorization: `Bearer ${TOKEN}`,

                },
                params: {
                  blobName: f.blobName,
                },
              });

              return { ...f, fileUrl: url.data.sasUrl };
            } catch (err) {
              console.error("Failed to get URL for blob:", f.blobName, err);
              return { ...f, fileUrl: null };
            }
          })
        );
        return { ...item, files: filesWithUrl };
      })
    );

    res.status(200).json({ data: itemsWithFileUrls });
  } catch (err) {
    console.error("List capsules error:", err);
    res.status(500).json({ error: "Failed to list capsules" });
  }
});


/**
 * GET /api/capsules/:id  (get signed URLs if unlocked and user has access)
 */
router.get("/:id", requireToken, async (req, res) => {
  try {
    const cap = await Capsule.findById(req.params.id).lean();
    if (!cap) return res.status(404).json({ error: "Not found" });

    // Check if user has access to this capsule
    const hasAccess =
      cap.createdBy === req.userId ||
      (cap.recipients && cap.recipients.includes(req.userId)) ||
      cap.visibility === "public";

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if capsule is unlocked
    if (new Date(cap.unlockDate) > new Date()) {
      return res.json({
        unlocked: false,
        unlockDate: cap.unlockDate,
        title: cap.title,
        description: cap.description,
        createdBy: cap.createdBy,
        recipients: cap.recipients,
      });
    }

    // Generate signed URLs for files
    const signedFiles = await Promise.all(
      cap.files.map(async (f) => {
        const url = getSignedUrl(
          f.blobName,
          parseInt(process.env.SIGNED_URL_EXP_SECONDS || "900", 10),
        );
        return { ...f, signedUrl: url };
      }),
    );

    res.json({
      unlocked: true,
      id: cap._id,
      title: cap.title,
      description: cap.description,
      createdBy: cap.createdBy,
      recipients: cap.recipients,
      visibility: cap.visibility,
      files: signedFiles,
      createdAt: cap.createdAt,
    });
  } catch (err) {
    console.error("Get capsule error", err);
    res.status(500).json({ error: "Failed to fetch capsule" });
  }
});

/**
 * DELETE /api/capsules/:id (only creator can delete)
 */
router.delete("/:id", requireToken, async (req, res) => {
  try {
    const cap = await Capsule.findById(req.params.id);
    if (!cap) return res.status(404).json({ error: "Not found" });

    // Only creator can delete
    if (cap.createdBy !== req.userId) {
      return res.status(403).json({ error: "Only creator can delete" });
    }

    await Capsule.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: "Capsule deleted" });
  } catch (err) {
    console.error("Delete capsule error", err);
    res.status(500).json({ error: "Failed to delete capsule" });
  }
});

// upload additional files into an existing shared capsule (propagate to all recipients)
router.post(
  "/community/upload",
  requireToken,
  upload.array("files", 20),
  async (req, res) => {
    try {
      const { sharedCapsuleId, userId } = req.body;

      if (!sharedCapsuleId) {
        return res.status(400).json({ error: "sharedCapsuleId is required" });
      }

      // ensure shared capsule exists (use any doc with that sharedCapsuleId)
      const baseCapsule = await Capsule.findOne({ sharedCapsuleId }).lean();
      if (!baseCapsule) return res.status(404).json({ error: "Shared capsule not found" });

      // Determine the upload deadline: lockDate has priority, fallback to unlockDate if provided
      const uploadDeadline = baseCapsule.lockDate ? new Date(baseCapsule.lockDate) : baseCapsule.unlockDate ? new Date(baseCapsule.unlockDate) : null;
      if (uploadDeadline && new Date() > uploadDeadline) {
        return res.status(403).json({ error: "Capsule is closed for uploads (past lock date)" });
      }

      if (!req.files || !req.files.length) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // upload files to storage using the uploader helper
      const savedFiles = [];
      for (const f of req.files) {
        const owner = userId || req.userId || "unknown";
        const safeName = `${owner}/${Date.now()}_${f.originalname.replace(/\s+/g, "_")}`;
        const meta = await uploadBuffer(f.buffer, safeName, f.mimetype);
        savedFiles.push({
          originalName: f.originalname,
          blobName: meta.name,
          contentType: f.mimetype,
          size: meta.size,
          url: meta.url || null,
        });
      }

      // append these files into every document that shares the same sharedCapsuleId
      const updateResult = await Capsule.updateMany(
        { sharedCapsuleId },
        { $push: { files: { $each: savedFiles } } }
      );

      console.log("Appended files to shared capsule:", sharedCapsuleId, "savedFiles:", savedFiles.length);

      return res.json({
        ok: true,
        sharedCapsuleId,
        appended: savedFiles.length,
        modifiedCount: updateResult.modifiedCount ?? updateResult.nModified ?? 0,
        savedFiles,
      });
    } catch (err) {
      console.error("Community upload error:", err);
      return res.status(500).json({ error: "Failed to upload files to shared capsule" });
    }
  },
);

export default router;
