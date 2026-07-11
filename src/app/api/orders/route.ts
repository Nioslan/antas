import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createOrder, getStockSnapshot, readOrders } from "@/lib/orders";
import type { CreateOrderInput } from "@/types/orders";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const orders = await readOrders();
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CreateOrderInput;
    const order = await createOrder(body);
    const stock = await getStockSnapshot();
    return NextResponse.json({ order, stock }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al registrar la venta";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
