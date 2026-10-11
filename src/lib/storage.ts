import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import path from "path";

/**
 * Storage layer: guarda archivos en el servidor casero (S3/MinIO vía
 * Cloudflare Tunnel) cuando las variables S3_* están configuradas.
 * Si no, cae al filesystem local (comportamiento actual).
 *
 * Variables (Vercel → Settings → Environment Variables):
 *   S3_ENDPOINT    https://media.antaspc.com
 *   S3_BUCKET      antaspc
 *   S3_ACCESS_KEY  (service account de MinIO)
 *   S3_SECRET_KEY  (service account de MinIO)
 *   S3_PUBLIC_URL  https://media.antaspc.com/antaspc  (opcional)
 *   S3_REGION      us-east-1 (opcional)
 */

const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_BUCKET = process.env.S3_BUCKET;
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY;
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL;
const S3_REGION = process.env.S3_REGION ?? "us-east-1";

export function isS3Configured(): boolean {
  return Boolean(S3_ENDPOINT && S3_BUCKET && S3_ACCESS_KEY && S3_SECRET_KEY);
}

function getS3Client(): S3Client {
  return new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials: {
      accessKeyId: S3_ACCESS_KEY as string,
      secretAccessKey: S3_SECRET_KEY as string,
    },
    forcePathStyle: true, // MinIO usa path-style
  });
}

export type StoredFile = {
  url: string;
  storage: "s3" | "local";
};

/**
 * Guarda un archivo y devuelve su URL pública.
 * `subfolder` agrupa archivos dentro del bucket/carpeta (ej. "trade-ins").
 */
export async function saveFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
  subfolder = "",
): Promise<StoredFile> {
  const key = subfolder ? `${subfolder}/${filename}` : filename;

  if (isS3Configured()) {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: S3_BUCKET as string,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    const base = (S3_PUBLIC_URL ?? `${S3_ENDPOINT}/${S3_BUCKET}`).replace(/\/$/, "");
    return { url: `${base}/${key}`, storage: "s3" };
  }

  // Fallback local (desarrollo / antes de configurar el servidor)
  const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), buffer);
  const basePath = subfolder ? `/uploads/${subfolder}` : "/uploads";
  return { url: `${basePath}/${filename}`, storage: "local" };
}
