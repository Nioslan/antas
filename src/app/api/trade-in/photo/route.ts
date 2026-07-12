import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;

async function uploadVercelBlob(file: File, buffer: Buffer): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

  const blob = await put(
    `trade-ins/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`,
    buffer,
    {
      access: "public",
      contentType: file.type || "image/jpeg",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    },
  );

  return blob.url?.startsWith("http") ? blob.url : null;
}

async function uploadImgBB(buffer: Buffer): Promise<string | null> {
  const key = process.env.IMGBB_API_KEY;
  if (!key) return null;

  const body = new URLSearchParams();
  body.set("key", key);
  body.set("image", buffer.toString("base64"));

  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body,
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    success?: boolean;
    data?: { url?: string; display_url?: string };
  };
  const url = json.data?.display_url || json.data?.url;
  return json.success && url?.startsWith("http") ? url : null;
}

async function verifyUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.ok) return true;
    const res2 = await fetch(url, { method: "GET", redirect: "follow" });
    return res2.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Formato no permitido. Usa JPG, PNG o WebP." },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "La imagen no puede pesar más de 5 MB." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const hosts = [
      () => uploadVercelBlob(file, buffer),
      () => uploadImgBB(buffer),
    ];

    for (const upload of hosts) {
      try {
        const url = await upload();
        if (!url) continue;
        const ok = await verifyUrl(url);
        if (ok) return NextResponse.json({ url });
      } catch {
        // try next
      }
    }

    const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
    const hasImgbb = Boolean(process.env.IMGBB_API_KEY);

    return NextResponse.json(
      {
        error: "HOSTS_FAILED",
        message: hasBlob || hasImgbb
          ? "No se pudo publicar la foto. Intenta otra imagen."
          : "Falta configurar almacenamiento de fotos en Vercel (Blob o ImgBB).",
        needsSetup: !hasBlob && !hasImgbb,
      },
      { status: 502 },
    );
  } catch {
    return NextResponse.json(
      { error: "Error al publicar la foto" },
      { status: 500 },
    );
  }
}
