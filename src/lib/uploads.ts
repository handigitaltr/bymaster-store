import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { detectImageFit } from "@/lib/image-fit";
import { randomToken } from "@/lib/security/crypto";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif", "heif"]);

export function uploadRoot() {
  // Yükleme klasörü çalışma anında okunur; derleme çıktısına (dosya izleme) dahil edilmemelidir
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), env.UPLOAD_DIR);
}

export class UploadError extends Error {}

/**
 * Görsel yükleme: boyut ve MIME kontrolü, içeriğin gerçekten görsel olduğunun çözümlenerek doğrulanması,
 * EXIF/meta verilerin temizlenmesi (yeniden kodlama) ve tahmin edilemez dosya adı. SVG kabul edilmez (XSS riski).
 */
export async function saveImageUpload(file: File, options: { uploadedById: string; alt?: string | null; maxDimension?: number }) {
  if (file.size === 0) throw new UploadError("Dosya boş.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Dosya 5 MB'tan büyük olamaz.");
  if (!ALLOWED_TYPES.has(file.type)) throw new UploadError("Yalnızca JPG, PNG, WebP veya AVIF görselleri yüklenebilir.");

  const input = Buffer.from(await file.arrayBuffer());
  let metadata: Metadata;
  try {
    metadata = await sharp(input, { limitInputPixels: 40_000_000 }).metadata();
  } catch {
    throw new UploadError("Dosya geçerli bir görsel değil.");
  }
  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) throw new UploadError("Desteklenmeyen görsel biçimi.");

  const maxDimension = options.maxDimension ?? 2000;
  const output = await sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: maxDimension, height: maxDimension, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 86 })
    .toBuffer({ resolveWithObject: true });

  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const filename = `${randomToken(16)}.webp`;
  const storageKey = `${folder}/${filename}`;
  const target = path.join(uploadRoot(), folder, filename);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, output.data, { flag: "wx" });

  const asset = await db.mediaAsset.create({
    data: {
      storageKey,
      url: `/media/${storageKey}`,
      originalName: file.name.slice(0, 200),
      mimeType: "image/webp",
      sizeBytes: output.info.size,
      width: output.info.width,
      height: output.info.height,
      alt: options.alt?.slice(0, 200) ?? null,
      uploadedById: options.uploadedById,
    },
  });
  const fit = await detectImageFit(output.data);
  return { asset, fit };
}

/** storageKey'i güvenli şekilde dosya yoluna çevirir (dizin dışına çıkmayı engeller) */
export function resolveStoragePath(storageKey: string): string | null {
  if (!/^\d{4}\/\d{2}\/[A-Za-z0-9_-]{16,40}\.webp$/.test(storageKey)) return null;
  const root = uploadRoot();
  const resolved = path.resolve(/*turbopackIgnore: true*/ root, storageKey);
  return resolved.startsWith(root + path.sep) ? resolved : null;
}

export async function deleteStoredFile(storageKey: string) {
  const file = resolveStoragePath(storageKey);
  if (file) await fs.rm(file, { force: true });
}
