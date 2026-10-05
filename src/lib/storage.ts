import { createHash, randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export interface StoredObject {
  url: string;
  key: string;
  contentHash: string;
}

export interface SaveInput {
  buffer: Buffer;
  contentType: string;
  folder: string;
  extension: string;
  contentHash: string;
}

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOC_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export function extensionFor(contentType: string): string | null {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "application/pdf") return "pdf";
  return null;
}

export async function readUpload(
  entry: FormDataEntryValue,
  options: { documents?: boolean; maxBytes: number },
): Promise<{ buffer: Buffer; contentType: string; extension: string; contentHash: string } | null> {
  if (!(entry instanceof File) || entry.size === 0) return null;
  if (entry.size > options.maxBytes) {
    throw new Error("Each file must be 4 MB or smaller.");
  }
  const allowed = options.documents ? DOC_TYPES : IMAGE_TYPES;
  if (!allowed.has(entry.type)) {
    throw new Error(options.documents ? "Upload a JPG, PNG, WebP or PDF." : "Upload a JPG, PNG or WebP photo.");
  }
  const extension = extensionFor(entry.type);
  if (!extension) throw new Error("Unsupported file type.");
  const buffer = Buffer.from(await entry.arrayBuffer());
  const contentHash = createHash("sha256").update(buffer).digest("hex");
  return { buffer, contentType: entry.type, extension, contentHash };
}

export async function saveUpload(input: SaveInput): Promise<StoredObject> {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "s3") return saveS3(input);
  if (driver === "cloudinary") return saveCloudinary(input);
  if (driver === "imagekit") return saveImageKit(input);
  return saveLocal(input);
}

async function saveLocal(input: SaveInput): Promise<StoredObject> {
  const key = `${input.folder}/${Date.now()}-${randomBytes(6).toString("hex")}.${input.extension}`;
  const fullPath = path.join(process.cwd(), "public", "uploads", key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, input.buffer);
  return { url: `/uploads/${key}`, key, contentHash: input.contentHash };
}

async function saveS3(input: SaveInput): Promise<StoredObject> {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const publicBase = process.env.S3_PUBLIC_BASE_URL;
  if (!bucket || !region || !accessKeyId || !secretAccessKey || !publicBase) {
    throw new Error("S3 storage is not configured.");
  }
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId, secretAccessKey },
  });
  const key = `${input.folder}/${Date.now()}-${randomBytes(6).toString("hex")}.${input.extension}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: input.buffer,
      ContentType: input.contentType,
    }),
  );
  return { url: `${publicBase.replace(/\/$/, "")}/${key}`, key, contentHash: input.contentHash };
}

async function saveCloudinary(input: SaveInput): Promise<StoredObject> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !apiKey || !apiSecret) {
    throw new Error("Cloudinary storage is not configured.");
  }
  const timestamp = Math.round(Date.now() / 1000).toString();
  const folder = input.folder;
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  const bytes = Uint8Array.from(input.buffer);
  body.append("file", new Blob([bytes], { type: input.contentType }), `upload.${input.extension}`);
  body.append("api_key", apiKey);
  body.append("timestamp", timestamp);
  body.append("folder", folder);
  body.append("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, {
    method: "POST",
    body,
  });
  if (!response.ok) throw new Error("Cloudinary upload failed.");
  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null || !("secure_url" in payload)) {
    throw new Error("Cloudinary upload failed.");
  }
  const secureUrl = payload.secure_url;
  if (typeof secureUrl !== "string") throw new Error("Cloudinary upload failed.");
  return { url: secureUrl, key: secureUrl, contentHash: input.contentHash };
}

async function saveImageKit(input: SaveInput): Promise<StoredObject> {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!privateKey || !urlEndpoint) {
    throw new Error("ImageKit storage is not configured.");
  }
  const fileName = `${Date.now()}-${randomBytes(6).toString("hex")}.${input.extension}`;
  const folder = `nestverify/${input.folder}`.replace(/\/+/g, "/");
  const body = new FormData();
  const bytes = Uint8Array.from(input.buffer);
  body.append("file", new Blob([bytes], { type: input.contentType }), fileName);
  body.append("fileName", fileName);
  body.append("folder", folder);
  body.append("useUniqueFileName", "true");
  const auth = Buffer.from(`${privateKey}:`).toString("base64");
  const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}` },
    body,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail ? `ImageKit upload failed: ${detail.slice(0, 180)}` : "ImageKit upload failed.");
  }
  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null) {
    throw new Error("ImageKit upload failed.");
  }
  const record = payload as { url?: unknown; filePath?: unknown; fileId?: unknown };
  const url = typeof record.url === "string" ? record.url : null;
  const key =
    typeof record.fileId === "string"
      ? record.fileId
      : typeof record.filePath === "string"
        ? record.filePath
        : null;
  if (!url || !key) throw new Error("ImageKit upload failed.");
  return { url, key, contentHash: input.contentHash };
}
