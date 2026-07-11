import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isAdminAuthenticated } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
] as const;

const VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 80 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    }

    const isImage = (IMAGE_TYPES as readonly string[]).includes(file.type);
    const isVideo = (VIDEO_TYPES as readonly string[]).includes(file.type);

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          error:
            "Formato no permitido. Imágenes: JPG, PNG, WebP, SVG. Videos: MP4, WebM, MOV.",
        },
        { status: 400 },
      );
    }

    const max = isVideo ? VIDEO_MAX : IMAGE_MAX;
    if (file.size > max) {
      return NextResponse.json(
        {
          error: isVideo
            ? "El video no puede pesar más de 80 MB."
            : "La imagen no puede pesar más de 5 MB.",
        },
        { status: 400 },
      );
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? (isVideo ? "mp4" : "jpg");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

    return NextResponse.json({
      url: `/uploads/${filename}`,
      kind: isVideo ? "video" : "image",
    });
  } catch {
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 });
  }
}
