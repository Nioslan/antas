import { promises as fs } from "fs";
import path from "path";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export async function saveUploadedImage(
  file: File,
  subfolder = "",
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new Error("Formato no permitido. Usa JPG, PNG o WebP.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("La imagen no puede pesar más de 5 MB.");
  }

  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    subfolder,
  );
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  const basePath = subfolder ? `/uploads/${subfolder}` : "/uploads";
  return `${basePath}/${filename}`;
}
