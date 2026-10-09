import "server-only";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Cloudflare R2 storage for listing photographs.
 *
 * R2 speaks the S3 protocol, so the AWS S3 client talks to it directly with an
 * endpoint override and region "auto". Uploads are *presigned*: the browser asks
 * this module for a short-lived PUT URL, then sends the bytes straight to R2.
 * The image never passes through the Next server, which keeps a 6 MB photograph
 * out of a serverless request body and off the Node heap entirely.
 *
 * Everything is read from the environment at call time rather than at import, so
 * a checkout with no R2 credentials still builds and runs; the listing form
 * simply reports that uploads are unavailable instead of crashing the process on
 * the first import.
 *
 * Keys are content-addressed by a random id under `listings/`, never by the
 * uploader's filename: two sellers uploading `IMG_0421.JPG` must not collide,
 * and a filename a seller controls must never be allowed to shape a storage key.
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

/** How long a presigned PUT stays valid. Long enough for a slow connection,
    short enough that a leaked URL is not a standing invitation to write. */
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

/**
 * Returns a presigned PUT for one image, or null when R2 is not configured.
 * The `ContentType` is part of the signature, so the browser must send the same
 * header; a mismatch is rejected by R2 rather than stored under a wrong type.
 */
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

/**
 * True when a URL points at this bucket's public base. Used to refuse a listing
 * that carries an image URL from somewhere else: the field is a seller's, and a
 * seller must not be able to point a listing at an arbitrary third-party host.
 */
export function isStorageUrl(url: string): boolean {
  const config = readConfig();
  if (!config) return false;
  return url.startsWith(`${config.publicUrl}/`);
}
