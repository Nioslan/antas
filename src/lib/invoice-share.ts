import { formatWarrantyDate } from "@/lib/warranty";
import { formatPrice } from "@/lib/utils";
import { LINE_LABELS } from "@/types/inventory";
import { PAYMENT_METHOD_LABELS, type Order } from "@/types/orders";
import { siteConfig } from "@/lib/site";

/** Digits only for wa.me — uses the phone saved on the invoice/customer. */
export function normalizePhoneForWhatsApp(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  // US/Canada local 10-digit → add country code 1
  if (digits.length === 10) digits = `1${digits}`;
  return digits;
}

export function formatPhoneLabel(phone: string): string {
  const digits = normalizePhoneForWhatsApp(phone);
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone.trim() || digits;
}

export function buildInvoiceWhatsAppMessage(order: Order): string {
  const lines = order.items
    .map((item) => {
      const line = item.line ? ` (${LINE_LABELS[item.line]})` : "";
      return `• ${item.name}${line} x${item.quantity} — ${formatPrice(item.unitPrice * item.quantity)}`;
    })
    .join("\n");

  const warranty =
    order.warranty.months > 0
      ? [
          "",
          "Garantía ANTAS",
          `Cobertura: ${order.warranty.months} meses${order.warranty.extended ? " (extendida)" : ""}`,
          `Inicio: ${formatWarrantyDate(order.warranty.startsAt)}`,
          `Vence: ${formatWarrantyDate(order.warranty.endsAt)}`,
        ].join("\n")
      : "";

  return [
    `Hola ${order.customer.name}, gracias por tu compra en ${siteConfig.brand}.`,
    "",
    `Factura ${order.number}`,
    `Fecha: ${formatWarrantyDate(order.soldAt)}`,
    `Pago: ${PAYMENT_METHOD_LABELS[order.payment.method]}`,
    "",
    "Productos:",
    lines,
    order.warrantyFee > 0
      ? `Garantía extendida: ${formatPrice(order.warrantyFee)}`
      : null,
    "",
    `Total: ${formatPrice(order.total)}`,
    warranty,
    "",
    "Conserva este mensaje como comprobante. Cualquier duda, escríbenos.",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/**
 * Opens WhatsApp with the phone saved on this invoice
 * (order.customer.phone) — not the store number.
 */
export function getInvoiceWhatsAppUrl(order: Order): string | null {
  const phone = normalizePhoneForWhatsApp(order.customer.phone);
  if (phone.length < 10) return null;
  const text = encodeURIComponent(buildInvoiceWhatsAppMessage(order));
  return `https://wa.me/${phone}?text=${text}`;
}
