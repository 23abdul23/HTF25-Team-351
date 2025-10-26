import express from "express";
import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

import { requireAuth, getUserFromReq } from "../middleware/authentication.js";

const router = express.Router();

// Helper to get userId from request
async function getUserId(req) {
  const user = await getUserFromReq(req);
  return user?._id?.toString() || user?.id?.toString();
}

// Validate environment variables at startup
const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME || "capsules";

let blobServiceClient = null;
let accountName = null;
let accountKey = null;

if (CONNECTION_STRING) {
  try {
    blobServiceClient =
      BlobServiceClient.fromConnectionString(CONNECTION_STRING);

    const connStringParts = CONNECTION_STRING.split(";");
    for (const part of connStringParts) {
      if (part.startsWith("AccountName=")) {
        accountName = part.substring("AccountName=".length);
      }
      if (part.startsWith("AccountKey=")) {
        accountKey = part.substring("AccountKey=".length);
      }
    }

    console.log(" Azure Blob Storage configured successfully");
    console.log(`   Account: ${accountName}`);
    console.log(`   Container: ${AZURE_CONTAINER_NAME}`);
  } catch (err) {
    console.error(" Failed to initialize Azure Blob Storage:", err.message);
  }
} else {
  console.error(
    "AZURE_STORAGE_CONNECTION_STRING is not set in environment variables",
  );
  console.warn(
    " Azure Blob Storage not configured - SAS endpoint will not work",
  );
}

/**
 * POST /api/sas/generate
 * Generate SAS URL for uploading a file
 */
router.post("/generate", requireAuth, async (req, res) => {
  try {
    if (!blobServiceClient || !accountName || !accountKey) {
      return res.status(503).json({
        error:
          "Azure Blob Storage is not configured. Please check AZURE_STORAGE_CONNECTION_STRING.",
      });
    }

    const { fileName, contentType } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: "fileName is required" });
    }

    const timestamp = Date.now();
    const safeName = fileName.replace(/\s+/g, "_");
    const blobName = `${req.userId}/${timestamp}_${safeName}`;

    const containerClient =
      blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);
    const blobClient = containerClient.getBlobClient(blobName);

    const startsOn = new Date();
    const expiresOn = new Date(startsOn);
    expiresOn.setMinutes(startsOn.getMinutes() + 30); // 30 minutes expiry

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey,
    );

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: AZURE_CONTAINER_NAME,
        blobName: blobName,
        permissions: BlobSASPermissions.parse("cw"), // create, write
        startsOn,
        expiresOn,
        contentType: contentType || "application/octet-stream",
      },
      sharedKeyCredential,
    ).toString();

    const sasUrl = `${blobClient.url}?${sasToken}`;

    res.json({
      ok: true,
      sasUrl,
      blobName,
      expiresOn: expiresOn.toISOString(),
    });
  } catch (err) {
    console.error("Generate SAS error:", err);
    res
      .status(500)
      .json({ error: "Failed to generate SAS URL", details: err.message });
  }
});

/**
 * POST /api/sas/generate-batch
 * Generate multiple SAS URLs for batch upload
 */
router.post("/generate-batch", requireAuth, async (req, res) => {
  try {
    if (!blobServiceClient || !accountName || !accountKey) {
      return res.status(503).json({
        error: "Azure Blob Storage is not configured",
      });
    }

    const { files } = req.body; // Array of { fileName, contentType, size }

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "files array is required" });
    }

    if (files.length > 20) {
      return res
        .status(400)
        .json({ error: "Maximum 20 files allowed per batch" });
    }

    const containerClient =
      blobServiceClient.getContainerClient(AZURE_CONTAINER_NAME);
    const timestamp = Date.now();
    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey,
    );

    const sasUrls = files.map((file, index) => {
      const safeName = file.fileName.replace(/\s+/g, "_");
      const blobName = `${req.userId}/${timestamp}_${index}_${safeName}`;
      const blobClient = containerClient.getBlobClient(blobName);

      const startsOn = new Date();
      const expiresOn = new Date(startsOn);
      expiresOn.setMinutes(startsOn.getMinutes() + 30);

      const sasToken = generateBlobSASQueryParameters(
        {
          containerName: AZURE_CONTAINER_NAME,
          blobName: blobName,
          permissions: BlobSASPermissions.parse("cw"),
          startsOn,
          expiresOn,
          contentType: file.contentType || "application/octet-stream",
        },
        sharedKeyCredential,
      ).toString();

      return {
        originalName: file.fileName,
        blobName,
        sasUrl: `${blobClient.url}?${sasToken}`,
        contentType: file.contentType,
        size: file.size,
        expiresOn: expiresOn.toISOString(),
      };
    });

    res.json({
      ok: true,
      files: sasUrls,
    });
  } catch (err) {
    console.error("Generate batch SAS error:", err);
    res
      .status(500)
      .json({ error: "Failed to generate SAS URLs", details: err.message });
  }
});

/**
 * GET /api/sas/config-status
 * Check if Azure Blob Storage is properly configured
 */
router.get("/config-status", (req, res) => {
  res.json({
    configured: !!(blobServiceClient && accountName && accountKey),
    accountName: accountName || "not set",
    containerName: AZURE_CONTAINER_NAME,
    hasConnectionString: !!CONNECTION_STRING,
  });
});

export default router;
