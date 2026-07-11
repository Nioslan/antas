import { promises as fs } from "fs";
import path from "path";
import { readInventory, writeInventory } from "@/lib/inventory";
import {
  calculateExtendedWarranty,
  calculateWarrantyEndDate,
  getIncludedWarrantyMonths,
  getWarrantyMonths,
} from "@/lib/warranty";
import type {
  CreateOrderInput,
  Order,
  OrderItem,
  PaymentMethod,
} from "@/types/orders";

const DATA_PATH = path.join(process.cwd(), "data", "orders.json");

export async function readOrders(): Promise<Order[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
}

async function writeOrders(orders: Order[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(orders, null, 2), "utf-8");
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const orders = await readOrders();
  return orders.find((o) => o.id === id || o.number === id);
}

function nextInvoiceNumber(orders: Order[], soldAt: Date): string {
  const year = soldAt.getFullYear();
  const prefix = `ANT-${year}-`;
  const seq = orders
    .filter((o) => o.number.startsWith(prefix))
    .map((o) => Number(o.number.slice(prefix.length)))
    .filter((n) => Number.isFinite(n));
  const next = (seq.length ? Math.max(...seq) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const name = input.customer.name?.trim();
  const phone = input.customer.phone?.trim();
  if (!name || !phone) {
    throw new Error("Nombre y teléfono del cliente son obligatorios.");
  }
  if (!input.items?.length) {
    throw new Error("Agrega al menos un producto a la venta.");
  }

  const inventory = await readInventory();
  const soldAt = input.soldAt ? new Date(input.soldAt) : new Date();
  if (Number.isNaN(soldAt.getTime())) {
    throw new Error("Fecha de compra inválida.");
  }
  const soldAtIso = soldAt.toISOString();
  const extended = Boolean(input.extendedWarranty);

  const items: OrderItem[] = [];
  for (const line of input.items) {
    const qty = Math.max(1, Math.floor(Number(line.quantity) || 0));
    if (!qty) throw new Error("Cantidad inválida.");

    const product = inventory.products.find((p) => p.id === line.productId);
    if (!product) {
      throw new Error(`Producto no encontrado: ${line.productId}`);
    }
    if (product.stock < qty) {
      throw new Error(
        `Stock insuficiente para "${product.name}" (disponible: ${product.stock}).`,
      );
    }

    const months = getWarrantyMonths(product.line, extended && Boolean(product.line));
    items.push({
      productId: product.id,
      name: product.name,
      line: product.line,
      unitPrice: product.price,
      quantity: qty,
      warrantyMonths: months,
      warrantyEndsAt: calculateWarrantyEndDate(soldAt, months),
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const hasPc = items.some((i) => Boolean(i.line));
  const warrantyFee =
    extended && hasPc ? calculateExtendedWarranty(subtotal) : 0;
  const total = Math.round((subtotal + warrantyFee) * 100) / 100;

  const includedMonths = Math.max(
    0,
    ...items.map((i) => getIncludedWarrantyMonths(i.line)),
  );
  const warrantyMonths = extended && hasPc
    ? 6
    : includedMonths;
  const warrantyEndsAt = calculateWarrantyEndDate(soldAt, warrantyMonths);

  const method: PaymentMethod = input.paymentMethod ?? "cash";
  const orders = await readOrders();
  const number = nextInvoiceNumber(orders, soldAt);
  const now = new Date().toISOString();

  const order: Order = {
    id: `ord-${Date.now()}`,
    number,
    customer: {
      name,
      phone,
      email: input.customer.email?.trim() || undefined,
    },
    items,
    subtotal,
    extendedWarranty: extended && hasPc,
    warrantyFee,
    total,
    payment: {
      method,
      amount: total,
      paidAt: soldAtIso,
      note: input.paymentNote?.trim() || undefined,
    },
    status: "paid",
    warranty: {
      extended: extended && hasPc,
      includedMonths,
      months: warrantyMonths,
      startsAt: soldAtIso,
      endsAt: warrantyEndsAt,
    },
    note: input.note?.trim() || undefined,
    soldAt: soldAtIso,
    createdAt: now,
  };

  for (const item of items) {
    const idx = inventory.products.findIndex((p) => p.id === item.productId);
    if (idx === -1) continue;
    inventory.products[idx] = {
      ...inventory.products[idx],
      stock: inventory.products[idx].stock - item.quantity,
      updatedAt: now,
    };
  }

  await writeInventory(inventory);
  await writeOrders([order, ...orders]);
  return order;
}

/** Latest stock values after a sale (for admin UI sync). */
export async function getStockSnapshot(): Promise<
  { id: string; stock: number }[]
> {
  const inventory = await readInventory();
  return inventory.products.map((p) => ({ id: p.id, stock: p.stock }));
}

export async function deleteOrder(
  id: string,
  options?: { restoreStock?: boolean },
): Promise<Order | null> {
  const orders = await readOrders();
  const index = orders.findIndex((o) => o.id === id || o.number === id);
  if (index === -1) return null;

  const [removed] = orders.splice(index, 1);
  const restoreStock = options?.restoreStock !== false;

  if (restoreStock && removed.status !== "cancelled") {
    const inventory = await readInventory();
    const now = new Date().toISOString();
    for (const item of removed.items) {
      const idx = inventory.products.findIndex((p) => p.id === item.productId);
      if (idx === -1) continue;
      inventory.products[idx] = {
        ...inventory.products[idx],
        stock: inventory.products[idx].stock + item.quantity,
        updatedAt: now,
      };
    }
    await writeInventory(inventory);
  }

  await writeOrders(orders);
  return removed;
}
