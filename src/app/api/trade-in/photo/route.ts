import { NextRequest, NextResponse } from "next/server";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Hosts the trade-in photo on a temporary public URL so WhatsApp
 * can include a clickable link (wa.me cannot attach image files).
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    }

    if (!ALLOWED.includes(file.type) && !file.type.startsWith("image/")) {
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

    const upload = new FormData();
    upload.append("reqtype", "fileupload");
    upload.append("time", "72h");
    upload.append("fileToUpload", file, "antas-trade-in.jpg");

    const res = await fetch(
      "https://litterbox.catbox.moe/resources/intercept.php",
      { method: "POST", body: upload },
    );

    const url = (await res.text()).trim();

    if (!res.ok || !url.startsWith("http")) {
      // Fallback: catbox permanent (no account)
      const fallback = new FormData();
      fallback.append("reqtype", "fileupload");
      fallback.append("fileToUpload", file, "antas-trade-in.jpg");
      const res2 = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: fallback,
      });
      const url2 = (await res2.text()).trim();
      if (!res2.ok || !url2.startsWith("http")) {
        return NextResponse.json(
          { error: "No se pudo publicar la foto. Intenta de nuevo." },
          { status: 502 },
        );
      }
      return NextResponse.json({ url: url2, expires: null });
    }

    return NextResponse.json({ url, expires: "72h" });
  } catch {
    return NextResponse.json(
      { error: "Error al publicar la foto" },
      { status: 500 },
    );
  }
}
