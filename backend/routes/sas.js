import express from "express";
import multer from "multer";
import Capsule from "../models/Capsule.js";
import { uploadBuffer, getSignedUrl } from "../services/azureBlob.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

// simple token middleware (replace with your real one)
function requireToken(req, res, next) {
  const token = req.header("x-api-token") || req.query.token;
  if (token !== process.env.SINGLE_USER_TOKEN)
    return res.status(401).json({ error: "Unauthorized" });
  next();
}

/**
 * POST /api/capsules
 * JSON flow (SAS): { title, description, unlockDate, blobs: [{ blobName, originalName, contentType, size }] }
 */
router.post("/", requireToken, express.json(), async (req, res) => {
  try {
    const { title, description, unlockDate, blobs } = req.body;
    if (!Array.isArray(blobs) || blobs.length === 0) {
      return res.status(400).json({ error: "blobs array required" });
    }

    // validate blobs entries
    const savedFiles = [];
    for (const b of blobs) {
      if (!b || typeof b.blobName !== "string") continue;
      // ensure blobName matches our naming convention: /^\d+_.+/
      if (!/^\d+_.+/.test(b.blobName)) continue;
      savedFiles.push({
        originalName:
          b.originalName || b.blobName.split("_").slice(1).join("_"),
        blobName: b.blobName,
        contentType: b.contentType || "application/octet-stream",
        size: b.size || 0,
      });
    }

    if (!savedFiles.length)
      return res.status(400).json({ error: "No valid blobs provided" });

    const capsule = await Capsule.create({
      title: title || savedFiles.map((s) => s.originalName).join(", "),
      description,
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
      const { title, description, unlockDate } = req.body;
      if (!req.files || !req.files.length)
        return res.status(400).json({ error: "No files uploaded" });

      const savedFiles = [];
      for (const f of req.files) {
        const safeName = `${Date.now()}_${f.originalname.replace(/\s+/g, "_")}`;
        const meta = await uploadBuffer(f.buffer, safeName, f.mimetype);
        savedFiles.push({
          originalName: f.originalname,
          blobName: meta.name,
          contentType: f.mimetype,
          size: meta.size,
        });
      }

      const capsule = await Capsule.create({
        title: title || savedFiles.map((s) => s.originalName).join(", "),
        description,
        files: savedFiles,
        unlockDate: unlockDate ? new Date(unlockDate) : new Date(),
      });

      res.json({ ok: true, id: capsule._id });
    } catch (err) {
      console.error("Create capsule (multipart) error", err);
      res.status(500).json({ error: "Failed to upload files" });
    }
  },
);

/**
 * GET /api/capsules  (list metadata)
 */
router.get("/", requireToken, async (req, res) => {
  try {
    const items = await Capsule.find().sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    console.error("List capsules error", err);
    res.status(500).json({ error: "Failed to list capsules" });
  }
});

/**
 * GET /api/capsules/:id  (get signed URLs if unlocked)
 */
router.get("/:id", requireToken, async (req, res) => {
  try {
    const cap = await Capsule.findById(req.params.id).lean();
    if (!cap) return res.status(404).json({ error: "Not found" });
    if (new Date(cap.unlockDate) > new Date()) {
      return res.json({ unlocked: false, unlockDate: cap.unlockDate });
    }

    const signedFiles = await Promise.all(
      cap.files.map(async (f) => {
        const url = await getSignedUrl(
          f.blobName,
          parseInt(process.env.SIGNED_URL_EXP_SECONDS || "900", 10)
        );
        return { ...f, signedUrl: url };
      })
    );

    res.json({
      unlocked: true,
      id: cap._id,
      title: cap.title,
      description: cap.description,
      files: signedFiles,
    });
  } catch (err) {
    console.error("Get capsule error", err);
    res.status(500).json({ error: "Failed to get capsule" });
  }
});

export default router;
