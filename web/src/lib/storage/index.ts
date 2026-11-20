import { randomBytes } from "crypto";
import sharp, { type Metadata } from "sharp";
import { cloudinaryDriver } from "./cloudinary";
import { localDriver } from "./local";
import { vercelBlobDriver } from "./vercel-blob";
import type { StorageDriver } from "./types";

export function getDriver(name?: string): StorageDriver {
  const n = name || process.env.STORAGE_DRIVER || "local";
  if (n === "cloudinary") return cloudinaryDriver;
  if (n === "vercel-blob") return vercelBlobDriver;
  return localDriver;
}

export const ALLOWED_FORMATS = ["jpeg", "png", "webp", "gif", "avif"] as const;

export function maxUploadBytes(): number {
  const mb = Number(process.env.MAX_UPLOAD_MB || 8);
  return Math.max(1, Math.min(50, mb)) * 1024 * 1024;
}

export class UploadError extends Error {}

export interface ProcessedImage {
  data: Buffer;
  width: number;
  height: number;
  mimeType: string;
  ext: string;
}

/**
 * التحقق من الصورة من محتواها الفعلي (وليس من الامتداد) ثم ضغطها وتحويلها إلى WebP.
 * يزيل البيانات الوصفية (EXIF) تلقائياً.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  if (input.length === 0) throw new UploadError("الملف فارغ");
  if (input.length > maxUploadBytes()) throw new UploadError("حجم الملف يتجاوز الحد المسموح");
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: 40_000_000 }).metadata();
  } catch {
    throw new UploadError("الملف ليس صورة صالحة");
  }
  if (!meta.format || !(ALLOWED_FORMATS as readonly string[]).includes(meta.format)) {
    throw new UploadError("صيغة الصورة غير مدعومة (JPEG, PNG, WebP, GIF, AVIF)");
  }
  const { data, info } = await sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, mimeType: "image/webp", ext: "webp" };
}

export function makeStorageKey(ext: string): string {
  const d = new Date();
  const ym = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return `${ym}/${randomBytes(12).toString("hex")}.${ext}`;
}
