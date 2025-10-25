import { BlobServiceClient } from "@azure/storage-blob";

const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_CONTAINER_NAME;

if (!connStr || !containerName)
  throw new Error(
    "Set AZURE_STORAGE_CONNECTION_STRING and AZURE_CONTAINER_NAME",
  );

const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
const containerClient = blobServiceClient.getContainerClient(containerName);

export async function uploadBuffer(
  buffer,
  destFilename,
  contentType,
  folder = "",
) {
  // This is important
  const blobName = folder ? `${folder}/${destFilename}` : destFilename;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  const props = await blockBlobClient.getProperties();
  return { name: blobName, size: props.contentLength };
}

// generate a read SAS URL for an existing blob
export function getSignedUrl(blobName, expiresSeconds = 900) {
  const expiresOn = new Date(Date.now() + expiresSeconds * 1000);
  const {
    generateBlobSASQueryParameters,
    BlobSASPermissions,
    StorageSharedKeyCredential,
  } = require("@azure/storage-blob");
  const account = connStr.match(/AccountName=([^;]+)/)[1];
  const key = connStr.match(/AccountKey=([^;]+)/)[1];
  const sharedKeyCredential = new StorageSharedKeyCredential(account, key);

  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r").toString(),
      expiresOn,
    },
    sharedKeyCredential,
  ).toString();

  const blobUrl = containerClient.getBlockBlobClient(blobName).url;
  return `${blobUrl}?${sas}`;
}

// generate SAS URL for upload
export function generateUploadSas(blobName, expiresSeconds = 900) {
  const expiresOn = new Date(Date.now() + expiresSeconds * 1000);
  const {
    generateBlobSASQueryParameters,
    BlobSASPermissions,
    StorageSharedKeyCredential,
  } = require("@azure/storage-blob");
  const account = connStr.match(/AccountName=([^;]+)/)[1];
  const key = connStr.match(/AccountKey=([^;]+)/)[1];
  const sharedKeyCredential = new StorageSharedKeyCredential(account, key);

  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("cw").toString(),
      expiresOn,
    },
    sharedKeyCredential,
  ).toString();

  const url = `${containerClient.getBlockBlobClient(blobName).url}?${sas}`;
  return url;
}

export async function testConnection() {
  console.log("Testing Azure Blob Storage connection...");
  try {
    let count = 0;
    for await (const blob of containerClient.listBlobsFlat()) {
      console.log(" -", blob.name);
      count++;
      if (count >= 10) break; // list first 10 blobs only
    }
    if (count === 0) console.log("No blobs found in container (empty).");
    else console.log(`Listed ${count} blobs successfully.`);
    console.log("Azure Blob Storage connection OK ✅");
  } catch (err) {
    console.error("Azure Blob Storage connection FAILED ❌", err);
  }
}
