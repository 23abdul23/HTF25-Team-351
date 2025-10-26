import express from "express";
import multer from "multer";
import Capsule from "../models/Capsule.js";
import { uploadBuffer, getSignedUrl } from "../services/azureBlob.js";
import { configDotenv } from "dotenv";
configDotenv();

import { verifyJwt } from "../lib/jwt.js";

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from "@azure/storage-blob";

const router = express.Router();

// Multer memory upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
});

// Simple token auth middleware
function requireToken(req, res, next) {
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

// Use the conncectio string
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!connectionString) {
  throw new Error("AZURE_STORAGE_CONNECTION_STRING missing in .env");
}

const containerName = process.env.AZURE_CONTAINER_NAME || "capsules";
const blobServiceClient =
  BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Helper: extract accountName + accountKey for SAS generation
const match = connectionString.match(/AccountName=(.*?);AccountKey=(.*?);/);
if (!match) throw new Error("Invalid Azure Storage connection string format");
const [_, accountName, accountKey] = match;
const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey,
);

/**
 * POST /api/capsules (JSON flow)
 */
router.post("/", requireToken, express.json(), async (req, res) => {
  try {
    const {
      title,
      description,
      unlockDate,
      blobs,
      createdBy,
      recepients,
      visibility,
    } = req.body;

    if (!createdBy)
      return res.status(400).json({ error: "createdBy is required" });
    if (!Array.isArray(blobs) || blobs.length === 0)
      return res.status(400).json({ error: "blobs array required" });

    const savedFiles = blobs
      .filter(
        (b) =>
          b && typeof b.blobName === "string" && /^\d+_.+/.test(b.blobName),
      )
      .map((b) => ({
        originalName:
          b.originalName || b.blobName.split("_").slice(1).join("_"),
        blobName: b.blobName,
        contentType: b.contentType || "application/octet-stream",
        size: b.size || 0,
      }));

    if (!savedFiles.length)
      return res.status(400).json({ error: "No valid blobs provided" });

    const capsule = await Capsule.create({
      title: title || savedFiles.map((s) => s.originalName).join(", "),
      description,
      createdBy,
      recepients: Array.isArray(recepients) ? recepients : [],
      visibility: ["private", "public", "shared"].includes(visibility)
        ? visibility
        : "private",
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
 * POST /api/capsules/upload (multipart/form-data)
 */
router.post(
  "/upload",
  requireToken,
  upload.array("files", 20),
  async (req, res) => {
    try {
      const {
        title,
        description,
        unlockDate,
        createdBy,
        recepients,
        visibility,
      } = req.body;

      if (!createdBy)
        return res.status(400).json({ error: "createdBy is required" });
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
        createdBy,
        recepients: Array.isArray(recepients) ? recepients : [],
        visibility: ["private", "public", "shared"].includes(visibility)
          ? visibility
          : "private",
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
 * POST /api/sas/get-sas
 * Query: blobName, permissions?, expiresInSeconds?
 */
router.get("/get-sas", requireToken, async (req, res) => {
  try {
    const blobName = req.query.blobName && String(req.query.blobName);
    const permissions = String(req.query.permissions || "r");
    const expiresInSeconds = parseInt(String(req.query.expiresInSeconds || "900"), 10);

    if (!blobName) return res.status(400).json({ error: "blobName is required" });

    const expiresOn = new Date(Date.now() + expiresInSeconds * 1000);
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse(permissions),
        expiresOn,
      },
      sharedKeyCredential,
    ).toString();

    const sasUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${encodeURIComponent(blobName)}?${sasToken}`;
    res.json({ sasUrl, expiresOn });
  } catch (err) {
    console.error("Generate SAS error", err);
    res.status(500).json({ error: "Failed to generate SAS" });
  }
});

/**
 * GET /api/capsules (list)
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
 * GET /api/capsules/:id (details + signed URLs)
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
          parseInt(process.env.SIGNED_URL_EXP_SECONDS || "900", 10),
        );
        return { ...f, signedUrl: url };
      }),
    );

    res.json({
      unlocked: true,
      ...cap,
      files: signedFiles,
    });
  } catch (err) {
    console.error("Get capsule error", err);
    res.status(500).json({ error: "Shit Failed to get capsule" });
  }
});

export default router;
