import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isAdminAuthenticated } from "@/lib/auth";
import { readInventory, updateSettings } from "@/lib/inventory";
import type { InventorySettings } from "@/types/inventory";

export async function GET() {
  const settings = (await readInventory()).settings;
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<InventorySettings>;
    const settings = await updateSettings(body);
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 });
  }
}
