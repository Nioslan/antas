"use client";

import Image from "next/image";
import { Phone, Printer } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { getInvoiceWhatsAppUrl, formatPhoneLabel } from "@/lib/invoice-share";
import { formatWarrantyDate } from "@/lib/warranty";
import { formatPrice } from "@/lib/utils";
import { LINE_LABELS } from "@/types/inventory";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type Order,
} from "@/types/orders";

type InvoiceDocumentProps = {
  order: Order;
  logoUrl?: string;
};

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function InvoiceDocument({ order, logoUrl }: InvoiceDocumentProps) {
  const whatsappUrl = getInvoiceWhatsAppUrl(order);

  return (
    <div className="min-h-screen bg-[#0b0f16] text-foreground print:bg-white print:text-black">
      <div className="mx-auto max-w-3xl px-4 py-6 print:max-w-none print:px-0 print:py-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <a href="/admin" className="text-sm text-muted hover:text-cyan">
            ← Volver al panel
          </a>
          <div className="flex flex-wrap gap-2">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-cyan/40 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan transition hover:bg-cyan/20"
                title={`Enviar factura a ${order.customer.phone}`}
              >
                <Phone className="h-4 w-4" />
                Enviar a {formatPhoneLabel(order.customer.phone)}
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full bg-cyan px-4 py-2 text-sm font-semibold text-black"
            >
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </button>
          </div>
        </div>

        <article className="rounded-2xl border border-border bg-surface p-6 sm:p-8 print:rounded-none print:border-0 print:bg-white print:p-0">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6 print:border-black/20">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={siteConfig.brand}
                  width={48}
                  height={48}
                  className="h-12 w-auto object-contain"
                  unoptimized
                />
              ) : null}
              <div>
                <p className="text-lg font-semibold tracking-[0.18em]">
                  {siteConfig.brand}
                </p>
                <p className="text-xs text-muted print:text-black/60">
                  {siteConfig.address} · {siteConfig.email}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold tracking-[0.22em] text-muted uppercase print:text-black/50">
                Factura
              </p>
              <p className="text-xl font-semibold text-cyan print:text-black">
                {order.number}
              </p>
              <p className="mt-1 text-xs text-muted print:text-black/60">
                {ORDER_STATUS_LABELS[order.status]}
              </p>
            </div>
          </header>

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-muted uppercase print:text-black/50">
                Cliente
              </p>
              <p className="mt-1 font-medium">{order.customer.name}</p>
              <p className="text-sm text-muted print:text-black/70">
                {order.customer.phone}
              </p>
              {order.customer.email ? (
                <p className="text-sm text-muted print:text-black/70">
                  {order.customer.email}
                </p>
              ) : null}
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-semibold tracking-[0.2em] text-muted uppercase print:text-black/50">
                Compra
              </p>
              <p className="mt-1 text-sm">
                Fecha: <strong>{formatDateTime(order.soldAt)}</strong>
              </p>
              <p className="text-sm">
                Pago:{" "}
                <strong>{PAYMENT_METHOD_LABELS[order.payment.method]}</strong>
              </p>
              {order.payment.note ? (
                <p className="text-sm text-muted print:text-black/70">
                  {order.payment.note}
                </p>
              ) : null}
            </div>
          </section>

          <section className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] tracking-[0.16em] text-muted uppercase print:border-black/20 print:text-black/50">
                  <th className="pb-2 font-semibold">Producto</th>
                  <th className="pb-2 font-semibold">Cant.</th>
                  <th className="pb-2 font-semibold">Precio</th>
                  <th className="pb-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr
                    key={`${item.productId}-${item.name}`}
                    className="border-b border-border/70 print:border-black/10"
                  >
                    <td className="py-3 pr-3">
                      <p className="font-medium">{item.name}</p>
                      {item.line ? (
                        <p className="text-xs text-muted print:text-black/60">
                          {LINE_LABELS[item.line]}
                          {item.warrantyMonths > 0
                            ? ` · Garantía ${item.warrantyMonths} meses`
                            : ""}
                          {item.warrantyEndsAt
                            ? ` · Vence ${formatWarrantyDate(item.warrantyEndsAt)}`
                            : ""}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3">{item.quantity}</td>
                    <td className="py-3">{formatPrice(item.unitPrice)}</td>
                    <td className="py-3 text-right">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))}
                {order.warrantyFee > 0 ? (
                  <tr className="border-b border-border/70 print:border-black/10">
                    <td className="py-3 pr-3" colSpan={3}>
                      Garantía extendida (6 meses)
                    </td>
                    <td className="py-3 text-right">
                      {formatPrice(order.warrantyFee)}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>

          <section className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="rounded-xl border border-cyan/30 bg-cyan/5 px-4 py-3 print:border-black/20 print:bg-transparent">
              <p className="text-[10px] font-semibold tracking-[0.2em] text-cyan uppercase print:text-black/50">
                Garantía ANTAS
              </p>
              {order.warranty.months > 0 ? (
                <>
                  <p className="mt-1 text-sm">
                    Cobertura:{" "}
                    <strong>
                      {order.warranty.months} meses
                      {order.warranty.extended ? " (extendida)" : ""}
                    </strong>
                  </p>
                  <p className="text-sm">
                    Inicio:{" "}
                    <strong>{formatWarrantyDate(order.warranty.startsAt)}</strong>
                  </p>
                  <p className="text-sm">
                    Vence:{" "}
                    <strong>{formatWarrantyDate(order.warranty.endsAt)}</strong>
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted print:text-black/70">
                  Esta venta no incluye PC con garantía de línea.
                </p>
              )}
            </div>

            <div className="min-w-[12rem] text-sm sm:text-right">
              <div className="flex justify-between gap-8 text-muted print:text-black/60 sm:justify-end">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.warrantyFee > 0 ? (
                <div className="mt-1 flex justify-between gap-8 text-muted print:text-black/60 sm:justify-end">
                  <span>Garantía extendida</span>
                  <span>{formatPrice(order.warrantyFee)}</span>
                </div>
              ) : null}
              <div className="mt-2 flex justify-between gap-8 border-t border-border pt-2 text-base font-semibold print:border-black/20 sm:justify-end">
                <span>Total pagado</span>
                <span className="text-cyan print:text-black">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </section>

          {order.note ? (
            <p className="mt-6 text-xs text-muted print:text-black/60">
              Nota: {order.note}
            </p>
          ) : null}

          <footer className="mt-8 border-t border-border pt-4 text-xs text-muted print:border-black/20 print:text-black/50">
            Gracias por comprar en {siteConfig.brand}. Conserva esta factura
            como comprobante de compra y garantía. Política completa en{" "}
            {siteConfig.brand.toLowerCase()}.com/garantia
          </footer>
        </article>
      </div>
    </div>
  );
}
