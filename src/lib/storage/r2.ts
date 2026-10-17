import "server-only";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 over the S3 protocol: uploads are presigned PUTs straight from the
 * browser, env is read at call time, keys are random ids under `listings/`, never filenames.
 */

export const IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export type ImageContentType = (typeof IMAGE_CONTENT_TYPES)[number];

export function isAllowedImageType(value: string): value is ImageContentType {
  return (IMAGE_CONTENT_TYPES as readonly string[]).includes(value);
}

/** 8 MB. A phone photograph is large; a raw is not something this form wants. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export const MAX_IMAGES_PER_LISTING = 8;

/** Presigned PUT lifetime: long enough for a slow upload, short enough that a leaked URL expires quickly. */
const UPLOAD_URL_TTL_SECONDS = 60 * 5;

interface StorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Public base URL of the bucket, no trailing slash. */
  publicUrl: string;
}

function readConfig(): StorageConfig | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

export function isStorageConfigured(): boolean {
  return readConfig() !== null;
}

let cachedClient: S3Client | null = null;
let cachedKey = "";

function client(config: StorageConfig): S3Client {
  const fingerprint = `${config.accountId}:${config.accessKeyId}:${config.bucket}`;
  if (cachedClient && cachedKey === fingerprint) return cachedClient;

  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  cachedKey = fingerprint;
  return cachedClient;
}

const EXTENSION_BY_TYPE: Record<ImageContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function objectKey(contentType: ImageContentType): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `listings/${year}/${month}/${randomUUID()}.${EXTENSION_BY_TYPE[contentType]}`;
}

export interface PresignedUpload {
  /** The storage key, stored on the product so the URL can be rebuilt. */
  key: string;
  /** Where the browser PUTs the file. */
  uploadUrl: string;
  /** The URL the image is served from once uploaded. */
  publicUrl: string;
}

/** Presigned PUT, or null when R2 is unconfigured. The `ContentType` is signed, so the browser must send the same header. */
export async function presignImageUpload(
  contentType: ImageContentType,
): Promise<PresignedUpload | null> {
  const config = readConfig();
  if (!config) return null;

  const key = objectKey(contentType);
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client(config), command, {
    expiresIn: UPLOAD_URL_TTL_SECONDS,
  });

  return { key, uploadUrl, publicUrl: publicObjectUrl(key) };
}

/** The public URL for a stored key. Empty string when R2 is not configured. */
export function publicObjectUrl(key: string): string {
  const config = readConfig();
  if (!config) return "";
  return `${config.publicUrl}/${key}`;
}

/** True when a URL points at this bucket, so a listing cannot reference an arbitrary third-party host. */
export function isStorageUrl(url: string): boolean {
  const config = readConfig();
  if (!config) return false;
  return url.startsWith(`${config.publicUrl}/`);
}
