import { NextRequest, NextResponse } from "next/server";
import { saveUploadedImage } from "@/lib/upload";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    }

    const url = await saveUploadedImage(file, "trade-ins");
    return NextResponse.json({ url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al subir imagen";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
