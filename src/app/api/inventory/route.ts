import { NextResponse } from "next/server";
import { readInventory } from "@/lib/inventory";

export async function GET() {
  const data = await readInventory();
  return NextResponse.json(data);
}
