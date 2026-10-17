import { NextResponse } from "next/server";
import { currentAccount } from "@/lib/auth/session";
import { isObject, readJson } from "@/lib/auth/api";
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_LISTING,
  isAllowedImageType,
  isStorageConfigured,
  presignImageUpload,
  type ImageContentType,
} from "@/lib/storage/r2";

interface RequestedFile {
  type: string;
  size: number;
}

function parseFiles(body: unknown): RequestedFile[] | null {
  if (!isObject(body) || !Array.isArray(body.files)) return null;
  const files: RequestedFile[] = [];
  for (const entry of body.files) {
    if (!isObject(entry)) return null;
    const type = typeof entry.type === "string" ? entry.type : "";
    const size = typeof entry.size === "number" ? entry.size : Number(entry.size);
    files.push({ type, size: Number.isFinite(size) ? size : 0 });
  }
  return files;
}

export async function POST(request: Request): Promise<NextResponse> {
  const account = await currentAccount();
  if (!account || account.role !== "seller") {
    return NextResponse.json(
      { error: "Sign in as a seller to upload photographs." },
      { status: 401 },
    );
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      {
        error:
          "Image storage is not configured yet. Add the R2_ variables to .env, then restart the server.",
      },
      { status: 503 },
    );
  }

  const files = parseFiles(await readJson(request));
  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No photographs were supplied." }, { status: 400 });
  }
  if (files.length > MAX_IMAGES_PER_LISTING) {
    return NextResponse.json(
      { error: `Add up to ${MAX_IMAGES_PER_LISTING} photographs at a time.` },
      { status: 400 },
    );
  }

  const contentTypes: ImageContentType[] = [];
  for (const file of files) {
    if (!isAllowedImageType(file.type)) {
      return NextResponse.json(
        { error: "Photographs must be JPEG, PNG, WebP or AVIF." },
        { status: 400 },
      );
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Each photograph must be under 8 MB." },
        { status: 400 },
      );
    }
    contentTypes.push(file.type);
  }

  const uploads = await Promise.all(contentTypes.map((type) => presignImageUpload(type)));

  return NextResponse.json({
    uploads: uploads.filter(
      (upload): upload is NonNullable<typeof upload> => upload !== null,
    ),
  });
}
