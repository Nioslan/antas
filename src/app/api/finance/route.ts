import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  addFinanceEntry,
  deleteFinanceEntry,
  getFinanceSummary,
} from "@/lib/finance";
import type { CreateFinanceEntryInput } from "@/types/finance";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const data = await getFinanceSummary();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CreateFinanceEntryInput;
    const entry = await addFinanceEntry(body);
    const data = await getFinanceSummary();
    return NextResponse.json({ entry, ...data }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al guardar movimiento";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Falta el id" }, { status: 400 });
  }

  const ok = await deleteFinanceEntry(id);
  if (!ok) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const data = await getFinanceSummary();
  return NextResponse.json({ ok: true, ...data });
}
