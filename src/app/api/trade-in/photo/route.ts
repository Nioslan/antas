import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;

function asImageBlob(file: File, buffer: Buffer): Blob {
  return new Blob([new Uint8Array(buffer)], {
    type: file.type || "image/jpeg",
  });
}

async function uploadTmpFiles(blob: Blob): Promise<string | null> {
  const body = new FormData();
  body.append("file", blob, "antas-trade-in.jpg");

  const res = await fetch("https://tmpfiles.org/api/v1/upload", {
    method: "POST",
    body,
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    status?: string;
    data?: { url?: string };
  };
  const pageUrl = json.data?.url;
  if (!pageUrl?.startsWith("http")) return null;

  // https://tmpfiles.org/123 → https://tmpfiles.org/dl/123
  return pageUrl.replace("://tmpfiles.org/", "://tmpfiles.org/dl/");
}

async function uploadZeroXZero(blob: Blob): Promise<string | null> {
  const body = new FormData();
  body.append("file", blob, "antas-trade-in.jpg");

  const res = await fetch("https://0x0.st", { method: "POST", body });
  if (!res.ok) return null;
  const url = (await res.text()).trim();
  return url.startsWith("http") ? url : null;
}

async function uploadCatbox(blob: Blob): Promise<string | null> {
  const body = new FormData();
  body.append("reqtype", "fileupload");
  body.append("fileToUpload", blob, "antas-trade-in.jpg");

  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body,
  });
  if (!res.ok) return null;
  const url = (await res.text()).trim();
  return url.startsWith("http") ? url : null;
}

/** Optional: set IMGBB_API_KEY in Vercel for the most reliable free hosting. */
async function uploadImgBB(blob: Blob): Promise<string | null> {
  const key = process.env.IMGBB_API_KEY;
  if (!key) return null;

  const buffer = Buffer.from(await blob.arrayBuffer());
  const base64 = buffer.toString("base64");
  const body = new URLSearchParams();
  body.set("key", key);
  body.set("image", base64);

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
    const blob = asImageBlob(file, buffer);

    const hosts = [uploadImgBB, uploadTmpFiles, uploadZeroXZero, uploadCatbox];

    for (const upload of hosts) {
      try {
        const url = await upload(blob);
        if (url) return NextResponse.json({ url });
      } catch {
        // try next
      }
    }

    return NextResponse.json(
      {
        error: "HOSTS_FAILED",
        message: "No se pudo publicar la foto en este momento.",
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
