import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { addProduct } from "@/lib/inventory";
import type { Product } from "@/types/inventory";

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Omit<
      Product,
      "id" | "createdAt" | "updatedAt"
    >;
    const product = await addProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al guardar producto" }, { status: 500 });
  }
}
