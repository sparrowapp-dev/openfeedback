import { ContainerClient } from '@azure/storage-blob';
import { config } from '../config/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get the container client from the SAS URL
 */
function getContainerClient(): ContainerClient {
  if (!config.blobStorageUrl) {
    throw new Error('BLOB_STORAGE environment variable is not configured');
  }
  return new ContainerClient(config.blobStorageUrl);
}

/**
 * Upload a file to blob storage and return the public URL
 * @param buffer - File buffer
 * @param originalFilename - Original filename for extension extraction
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(
  buffer: Buffer,
  originalFilename: string,
  contentType: string
): Promise<string> {
  const containerClient = getContainerClient();
  
  // Generate unique filename with original extension
  const extension = originalFilename.split('.').pop() || 'bin';
  const uniqueFilename = `${uuidv4()}.${extension}`;
  
  // Get blob client
  const blockBlobClient = containerClient.getBlockBlobClient(uniqueFilename);
  
  // Upload the file
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: contentType,
    },
  });
  
  // Return the public URL (without SAS token for cleaner URLs)
  // The URL format is: https://<account>.blob.core.windows.net/<container>/<blob>
  const baseUrl = config.blobStorageUrl.split('?')[0];
  return `${baseUrl}/${uniqueFilename}`;
}

/**
 * Upload multiple files to blob storage
 * @param files - Array of file objects with buffer, originalname, and mimetype
 * @returns Array of public URLs
 */
export async function uploadFiles(
  files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>
): Promise<string[]> {
  const uploadPromises = files.map((file) =>
    uploadFile(file.buffer, file.originalname, file.mimetype)
  );
  return Promise.all(uploadPromises);
}

/**
 * Delete a file from blob storage
 * @param fileUrl - Public URL of the file to delete
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  const containerClient = getContainerClient();
  
  // Extract blob name from URL
  const urlParts = fileUrl.split('/');
  const blobName = urlParts[urlParts.length - 1];
  
  const blobClient = containerClient.getBlobClient(blobName);
  await blobClient.deleteIfExists();
}
