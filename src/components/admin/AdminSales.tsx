"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Phone, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getInvoiceWhatsAppUrl, formatPhoneLabel } from "@/lib/invoice-share";
import {
  calculateExtendedWarranty,
  getIncludedWarrantyMonths,
} from "@/lib/warranty";
import { cn, formatPrice } from "@/lib/utils";
import { LINE_LABELS, type Product } from "@/types/inventory";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type Order,
  type PaymentMethod,
} from "@/types/orders";

type AdminSalesProps = {
  products: Product[];
  onStockChange: (products: Product[]) => void;
};

type DraftItem = {
  productId: string;
  quantity: number;
};

const paymentMethods: PaymentMethod[] = ["cash", "transfer", "card", "other"];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function AdminSales({ products, onStockChange }: AdminSalesProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [note, setNote] = useState("");
  const [soldAt, setSoldAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [extendedWarranty, setExtendedWarranty] = useState(false);
  const [items, setItems] = useState<DraftItem[]>([
    { productId: "", quantity: 1 },
  ]);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [stockNotice, setStockNotice] = useState("");

  const availableProducts = useMemo(
    () => products.filter((p) => p.stock > 0),
    [products],
  );

  const draftLines = useMemo(() => {
    return items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        return { ...item, product };
      })
      .filter(Boolean) as { productId: string; quantity: number; product: Product }[];
  }, [items, products]);

  const subtotal = draftLines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  );
  const hasPc = draftLines.some((line) => Boolean(line.product.line));
  const warrantyFee =
    extendedWarranty && hasPc ? calculateExtendedWarranty(subtotal) : 0;
  const total = subtotal + warrantyFee;

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        setOrders((await res.json()) as Order[]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  function applyStockSnapshot(stock: { id: string; stock: number }[]) {
    const map = new Map(stock.map((s) => [s.id, s.stock]));
    onStockChange(
      products.map((p) =>
        map.has(p.id) ? { ...p, stock: map.get(p.id)! } : p,
      ),
    );
  }

  async function handleDelete(order: Order) {
    const ok = confirm(
      `¿Eliminar la factura ${order.number}?\n\nSe borrará del registro y se devolverá el stock de los productos.`,
    );
    if (!ok) return;

    setDeletingId(order.id);
    setStockNotice("");
    const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      if (Array.isArray(data.stock)) {
        applyStockSnapshot(data.stock);
      } else {
        onStockChange(
          products.map((p) => {
            const sold = order.items.find((i) => i.productId === p.id);
            if (!sold) return p;
            return { ...p, stock: p.stock + sold.quantity };
          }),
        );
      }
      setStockNotice(
        `Factura ${order.number} eliminada. Stock restaurado en inventario.`,
      );
    } else {
      alert(data.error || "No se pudo eliminar la factura.");
    }
    setDeletingId(null);
  }

  function resetForm() {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setPaymentMethod("cash");
    setPaymentNote("");
    setNote("");
    setSoldAt(new Date().toISOString().slice(0, 10));
    setExtendedWarranty(false);
    setItems([{ productId: "", quantity: 1 }]);
    setError("");
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail || undefined,
      },
      items: items
        .filter((i) => i.productId)
        .map((i) => ({
          productId: i.productId,
          quantity: Number(i.quantity) || 1,
        })),
      extendedWarranty,
      paymentMethod,
      paymentNote: paymentNote || undefined,
      note: note || undefined,
      soldAt: soldAt ? new Date(`${soldAt}T12:00:00`).toISOString() : undefined,
    };

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo registrar la venta.");
      setSaving(false);
      return;
    }

    const order = (data.order ?? data) as Order;
    setOrders((prev) => [order, ...prev]);

    if (Array.isArray(data.stock)) {
      applyStockSnapshot(data.stock);
      const soldNames = order.items
        .map((item) => {
          const left = data.stock.find(
            (s: { id: string; stock: number }) => s.id === item.productId,
          )?.stock;
          return `${item.name}: quedan ${left ?? "?"} en stock`;
        })
        .join(" · ");
      setStockNotice(`Venta cerrada. Inventario actualizado — ${soldNames}`);
    } else {
      onStockChange(
        products.map((p) => {
          const sold = order.items.find((i) => i.productId === p.id);
          if (!sold) return p;
          return { ...p, stock: Math.max(0, p.stock - sold.quantity) };
        }),
      );
      setStockNotice("Venta cerrada. El inventario bajó según lo vendido.");
    }

    resetForm();
    setShowForm(false);
    setSaving(false);
    window.open(`/admin/facturas/${order.id}`, "_blank");
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-black px-4 py-2.5 text-sm outline-none transition-colors focus:border-cyan/50";

  return (
    <div className="space-y-6">
      {stockNotice ? (
        <p className="rounded-xl border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-cyan">
          {stockNotice}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {!showForm && (
          <Button
            onClick={() => {
              resetForm();
              setStockNotice("");
              setShowForm(true);
            }}
            className="gap-2"
            disabled={availableProducts.length === 0}
          >
            <Plus className="h-4 w-4" />
            Nueva venta
          </Button>
        )}
        {availableProducts.length === 0 && !showForm ? (
          <p className="text-xs text-muted">
            No hay productos con stock. Sube el stock en Inventario para vender.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void loadOrders()}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted transition hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Actualizar
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-border bg-surface p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Registrar venta</h2>
              <p className="mt-1 text-xs text-muted">
                Guarda cliente, pago, factura y fechas de garantía. Al cerrar la
                venta, el stock baja automáticamente (ej. de 10 a 9).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-xs text-muted hover:text-foreground"
            >
              Cancelar
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 sm:col-span-1">
              <span className="text-xs text-muted">Cliente *</span>
              <input
                required
                className={inputClass}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre completo"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">Teléfono *</span>
              <input
                required
                className={inputClass}
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+1 ..."
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">Correo</span>
              <input
                type="email"
                className={inputClass}
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="opcional"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">Fecha de compra</span>
              <input
                type="date"
                className={inputClass}
                value={soldAt}
                onChange={(e) => setSoldAt(e.target.value)}
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                Productos
              </p>
              <button
                type="button"
                onClick={() =>
                  setItems((prev) => [...prev, { productId: "", quantity: 1 }])
                }
                className="text-xs text-cyan hover:underline"
              >
                + Agregar línea
              </button>
            </div>

            {items.map((item, index) => {
              const product = products.find((p) => p.id === item.productId);
              return (
                <div
                  key={index}
                  className="grid gap-2 rounded-xl border border-border/80 p-3 sm:grid-cols-[1fr_5.5rem_auto]"
                >
                  <select
                    required
                    className={inputClass}
                    value={item.productId}
                    onChange={(e) =>
                      updateItem(index, { productId: e.target.value })
                    }
                  >
                    <option value="">Seleccionar producto</option>
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatPrice(p.price)} (stock {p.stock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={product?.stock ?? 99}
                    className={inputClass}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, {
                        quantity: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                  />
                  <button
                    type="button"
                    disabled={items.length === 1}
                    onClick={() =>
                      setItems((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="rounded-xl border border-border px-3 text-xs text-muted disabled:opacity-40"
                  >
                    Quitar
                  </button>
                  {product?.line ? (
                    <p className="text-[11px] text-muted sm:col-span-3">
                      {LINE_LABELS[product.line]} · Garantía incluida{" "}
                      {getIncludedWarrantyMonths(product.line)} meses
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          {hasPc ? (
            <label className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3">
              <input
                type="checkbox"
                checked={extendedWarranty}
                onChange={(e) => setExtendedWarranty(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm">
                <span className="font-medium text-gold">Garantía extendida</span>
                <span className="mt-0.5 block text-xs text-muted">
                  6 meses totales · +{formatPrice(calculateExtendedWarranty(subtotal || 0))}{" "}
                  (10% del subtotal)
                </span>
              </span>
            </label>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">Método de pago</span>
              <select
                className={inputClass}
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod)
                }
              >
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">Nota del pago</span>
              <input
                className={inputClass}
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Ej. billetes, Zelle, etc."
              />
            </label>
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs text-muted">Nota interna</span>
              <input
                className={inputClass}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Opcional"
              />
            </label>
          </div>

          <div className="rounded-xl border border-border bg-black/40 px-4 py-3 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {warrantyFee > 0 ? (
              <div className="mt-1 flex justify-between text-gold">
                <span>Garantía extendida</span>
                <span>{formatPrice(warrantyFee)}</span>
              </div>
            ) : null}
            <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
              <span>Total</span>
              <span className="text-cyan">{formatPrice(total)}</span>
            </div>
          </div>

          {error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : null}

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Guardando..." : "Registrar venta y generar factura"}
          </Button>
        </form>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-[0.16em] text-muted uppercase">
          Registro de ventas ({orders.length})
        </h2>

        {loading ? (
          <p className="text-sm text-muted">Cargando ventas...</p>
        ) : orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            Aún no hay ventas registradas. Cuando cobres en efectivo (u otro
            método), regístrala aquí para generar la factura con garantía.
          </p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              const phoneUrl = getInvoiceWhatsAppUrl(order);
              return (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{order.number}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                        order.status === "paid"
                          ? "bg-cyan/15 text-cyan"
                          : "bg-white/5 text-muted",
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted">
                      {PAYMENT_METHOD_LABELS[order.payment.method]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">
                    {order.customer.name} · {order.customer.phone}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Compra {formatDate(order.soldAt)}
                    {order.warranty.endsAt
                      ? ` · Garantía hasta ${formatDate(order.warranty.endsAt)}`
                      : " · Sin garantía de PC"}
                    {" · "}
                    {formatPrice(order.total)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {phoneUrl ? (
                    <a
                      href={phoneUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan/35 bg-cyan/10 px-4 py-2 text-xs text-cyan transition hover:bg-cyan/20"
                      title={`Enviar factura a ${order.customer.phone}`}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Enviar a {formatPhoneLabel(order.customer.phone)}
                    </a>
                  ) : null}
                  <a
                    href={`/admin/facturas/${order.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted transition hover:border-cyan/40 hover:text-cyan"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Ver factura
                  </a>
                  <button
                    type="button"
                    disabled={deletingId === order.id}
                    onClick={() => void handleDelete(order)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-red-500/30 px-4 py-2 text-xs text-red-400 transition hover:border-red-400/50 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === order.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
