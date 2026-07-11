import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { deleteOrder, getOrderById, getStockSnapshot } from "@/lib/orders";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const removed = await deleteOrder(id, { restoreStock: true });
  if (!removed) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }

  const stock = await getStockSnapshot();
  return NextResponse.json({ ok: true, order: removed, stock });
}
