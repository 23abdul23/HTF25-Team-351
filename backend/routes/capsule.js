import express from "express";
import multer from "multer";
import Capsule from "../models/Capsule.js";
import { uploadBuffer, getSignedUrl, getFilesUrls } from "../services/azureBlob.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

// Enhanced token middleware that extracts userId
function requireToken(req, res, next) {
  const token = req.header("x-api-token") || req.query.token;
  if (token !== process.env.SINGLE_USER_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Extract userId from header or query (you should use JWT or session in production)
  req.userId = req.header("x-user-id") || req.query.userId;
  if (!req.userId) {
    return res.status(400).json({ error: "User ID required" });
  }

  next();
}

/**
 * POST /api/capsules
 * JSON flow (SAS): { title, description, unlockDate, recipients, visibility, blobs: [...] }
 */
router.post("/", requireToken, express.json(), async (req, res) => {
  try {
    const { title, description, unlockDate, recipients, visibility, blobs } =
      req.body;
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
      const { title, description, unlockDate, recipients, visibility } =
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
        const safeName = `${req.userId}/${Date.now()}_${f.originalname.replace(/\s+/g, "_")}`;
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
        createdBy: req.userId,
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

/**
 * GET /api/capsules  (list metadata - only accessible capsules)
 */
router.get("/", requireToken, async (req, res) => {
  try {
    // Find capsules where user is creator or recipient
    const items = await Capsule.find({
      $or: [
        { createdBy: req.userId },
        { recipients: req.userId },
        { visibility: "public" },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();


    // For each capsule, attach fileUrl to each file using getFilesUrls
    const itemsWithFileUrls = await Promise.all(
      items.map(async (item) => {
        const files = item.files || [];
        const filesWithUrl = await Promise.all(
          files.map(async (f) => {
            try {
              const url = await getFilesUrls(f.blobName);
              return { ...f, fileUrl: url };
            } catch (err) {
              console.error("Failed to get URL for blob:", f.blobName, err);
              return { ...f, fileUrl: null };
            }
          })
        );
        return { ...item, files: filesWithUrl };
      })
    );

    const items = await Capsule.find({
      $or: [
        { createdBy: req.userId },
        { recipients: req.userId },
        { visibility: "public" },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(items);
  } catch (err) {
    console.error("List capsules error", err);
    res.status(500).json({ error: "Failed to fetch capsules" });
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

export default router;
