import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Environment variables for S3
const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION || "eu-central-1";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY;
const S3_ENDPOINT = process.env.S3_ENDPOINT; // Useful for R2, DigitalOcean Spaces, etc.

let s3Client: S3Client | null = null;

if (S3_BUCKET && S3_ACCESS_KEY && S3_SECRET_KEY) {
  s3Client = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_KEY,
    },
    ...(S3_ENDPOINT ? { endpoint: S3_ENDPOINT } : {}),
  });
  console.log(`Cloud Storage Service initialized: Using S3 (${S3_BUCKET})`);
} else {
  console.log("Cloud Storage Service initialized: Local Disk Fallback (No S3 credentials found)");
}

/**
 * Uploads a file to Cloud Storage (S3) or falls back to local disk.
 * @param buffer The file buffer
 * @param originalName The original filename
 * @param mimetype The mime type (e.g. image/jpeg)
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(buffer: Buffer, originalName: string, mimetype: string): Promise<string> {
  const ext = path.extname(originalName) || "";
  const uniqueName = `${crypto.randomBytes(16).toString("hex")}-${Date.now()}${ext}`;

  if (s3Client && S3_BUCKET) {
    // S3 Upload
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: uniqueName,
      Body: buffer,
      ContentType: mimetype,
      ACL: "public-read", // Optional: adjust depending on your bucket policies
    });
    
    await s3Client.send(command);
    
    // Construct public URL
    // Note: If using custom endpoint (like Cloudflare R2), the public URL format might differ.
    // Standard AWS S3 format:
    if (S3_ENDPOINT) {
       // Just returning a relative-like path or custom domain if configured. 
       // You would usually map this to a CDN.
       return `${S3_ENDPOINT}/${S3_BUCKET}/${uniqueName}`;
    }
    return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${uniqueName}`;
  } else {
    // Local Disk Fallback
    const uploadDir = path.join(__dirname, "../../uploads");
    
    // Ensure directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueName);
    await fs.writeFile(filePath, buffer);
    
    return `/uploads/${uniqueName}`;
  }
}
