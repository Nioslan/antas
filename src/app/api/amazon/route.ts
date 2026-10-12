import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { readAmazon, writeAmazon } from "@/lib/amazon";
import type { AmazonData } from "@/types/amazon";

export async function GET() {
  const data = await readAmazon();
  return NextResponse.json(data);
}

function sanitize(data: AmazonData): AmazonData {
  const now = new Date().toISOString();
  return {
    tag: (data.tag ?? "").trim(),
    builds: (data.builds ?? []).map((b, i) => ({
      id: b.id || `build-${Date.now()}-${i}`,
      name: (b.name ?? "").trim(),
      description: (b.description ?? "").trim(),
      images: (b.images ?? []).filter(Boolean).slice(0, 12),
      videos: (b.videos ?? []).filter(Boolean).slice(0, 3),
      components: (b.components ?? [])
        .map((c) => ({
          name: (c.name ?? "").trim(),
          url: (c.url ?? "").trim(),
          price:
            c.price === null || c.price === undefined || (typeof c.price === "string" && c.price === "")
              ? null
              : Number(c.price),
        }))
        .filter((c) => c.name && c.url)
        .slice(0, 30),
      createdAt: b.createdAt || now,
      updatedAt: now,
    })),
    products: (data.products ?? []).map((p, i) => ({
      id: p.id || `aprod-${Date.now()}-${i}`,
      name: (p.name ?? "").trim(),
      category: (p.category ?? "").trim(),
      image: (p.image ?? "").trim(),
      url: (p.url ?? "").trim(),
      price:
        p.price === null || p.price === undefined || (typeof p.price === "string" && p.price === "")
          ? null
          : Number(p.price),
      badge: (p.badge ?? "").trim(),
      createdAt: p.createdAt || now,
      updatedAt: now,
    })),
  };
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as AmazonData;
    const clean = sanitize(body);
    await writeAmazon(clean);
    return NextResponse.json(clean);
  } catch {
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
