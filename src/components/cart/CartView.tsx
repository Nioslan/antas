"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Shield, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PaymentMethods } from "@/components/payments/PaymentMethods";
import { EXTENDED_WARRANTY_MONTHS, useCart } from "@/context/CartContext";
import { paymentsConfig } from "@/lib/payments";
import { siteConfig } from "@/lib/site";
import { calculateExtendedWarranty } from "@/lib/warranty";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function CartView() {
  const {
    items,
    extendedWarranty,
    subtotal,
    warrantyFee,
    total,
    hasPc,
    removeItem,
    updateQuantity,
    setExtendedWarranty,
    clearCart,
  } = useCart();

  if (items.length === 0) {
    return (
      <Container className="py-20 sm:py-28">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 inline-flex rounded-full border border-border bg-surface-elevated p-4">
            <ShoppingBag className="h-8 w-8 text-muted" />
          </div>
          <h1 className="text-2xl font-semibold">Tu carrito está vacío</h1>
          <p className="mt-2 text-sm text-muted">
            Explora nuestro catálogo y agrega productos para continuar.
          </p>
          <Button href="/pcs" className="mt-6">
            Ver catálogo
          </Button>
        </div>
      </Container>
    );
  }

  const warrantyPreview = calculateExtendedWarranty(subtotal);

  const whatsappOrder = encodeURIComponent(
    `Hola ANTAS, quiero completar mi pedido:\n\n` +
      items
        .map((i) => `• ${i.name} x${i.quantity} — ${formatPrice(i.price * i.quantity)}`)
        .join("\n") +
      `\n\nSubtotal: ${formatPrice(subtotal)}` +
      (extendedWarranty
        ? `\nGarantía extendida (${EXTENDED_WARRANTY_MONTHS} meses): ${formatPrice(warrantyFee)}`
        : "") +
      `\nTotal: ${formatPrice(total)}`,
  );

  return (
    <section className="relative bg-black py-10 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-cyan-glow),_transparent_55%)]" />
      <Container className="relative">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan">
            Tu pedido
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Carrito</h1>
          <p className="mt-1 text-sm text-muted">Revisa tu pedido antes de comprar.</p>
        </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-2xl border border-border bg-surface-elevated p-4 sm:p-5"
            >
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-black sm:h-28 sm:w-28">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted">
                    Sin foto
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <Link
                    href={`/pcs/${item.id}`}
                    className="font-medium transition-colors hover:text-cyan"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-1 text-lg text-cyan">
                    {formatPrice(item.price)}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-white/5 disabled:opacity-40"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:bg-white/5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-4 rounded-2xl border border-border bg-surface-elevated p-6">
            <h2 className="font-semibold">Resumen</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>

            {hasPc && (
              <div
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  extendedWarranty
                    ? "border-cyan/30 bg-cyan/5"
                    : "border-border bg-black/40",
                )}
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={extendedWarranty}
                    onChange={(e) => setExtendedWarranty(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-border accent-cyan"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-cyan" />
                      <span className="text-sm font-medium">
                        Garantía extendida {EXTENDED_WARRANTY_MONTHS} meses
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      +10% del total de la compra ({formatPrice(warrantyPreview)}).
                      Amplía la cobertura de hardware hasta 6 meses.
                    </p>
                    <Link
                      href="/garantia"
                      className="mt-2 inline-block text-xs text-cyan hover:underline"
                    >
                      Ver política de garantía
                    </Link>
                  </div>
                </label>
              </div>
            )}

            {extendedWarranty && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Garantía extendida</span>
                <span className="text-cyan">+{formatPrice(warrantyFee)}</span>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-cyan">{formatPrice(total)}</span>
              </div>
            </div>

            {!paymentsConfig.onlinePaymentsEnabled && (
              <div className="rounded-xl border border-gold/25 bg-gold/5 p-4">
                <p className="text-xs font-medium text-gold">
                  Pagos con tarjeta, Klarna y Affirm — próximamente
                </p>
                <p className="mt-1 text-xs text-muted">
                  Mientras activamos LLC y Stripe, completa tu pedido por WhatsApp.
                </p>
                <Link
                  href="/financiamiento"
                  className="mt-2 inline-block text-xs text-cyan hover:underline"
                >
                  Ver financiamiento
                </Link>
                <PaymentMethods className="mt-3" />
              </div>
            )}

            <Button
              href={`https://wa.me/${siteConfig.whatsapp}?text=${whatsappOrder}`}
              className="w-full"
            >
              Completar pedido por WhatsApp
            </Button>

            <Button href="/pcs" variant="ghost" className="w-full">
              Seguir comprando
            </Button>

            <button
              type="button"
              onClick={clearCart}
              className="w-full text-center text-xs text-muted transition-colors hover:text-red-400"
            >
              Vaciar carrito
            </button>
          </div>
        </div>
      </div>
      </Container>
    </section>
  );
}
