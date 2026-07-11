import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageCircle,
  Wallet,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PaymentMethods } from "@/components/payments/PaymentMethods";
import {
  financingFaqs,
  llcChecklist,
  paymentMethods,
  paymentsConfig,
} from "@/lib/payments";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Financiamiento y Pagos",
  description:
    "Opciones de pago en ANTASPC Miami: tarjeta, Klarna, Affirm y más. Compra hoy por WhatsApp mientras activamos pagos online.",
};

const icons = {
  card: CreditCard,
  klarna: Wallet,
  affirm: Wallet,
  apple_google: CreditCard,
  whatsapp: MessageCircle,
};

export default function FinanciamientoPage() {
  return (
    <SiteLayout>
      <section className="relative border-b border-border bg-background py-14 sm:py-20">
        <Container className="relative">
          <SectionHeader
            badge="Pagos ANTASPC"
            title="Financiamiento y"
            highlight="formas de pago"
            description={`Tienda en ${paymentsConfig.location}. Estamos preparando pagos online con tarjeta, Klarna y Affirm. Mientras tanto, compra por WhatsApp.`}
          />

          {!paymentsConfig.onlinePaymentsEnabled && (
            <div className="mx-auto mb-10 flex max-w-2xl items-start gap-3 rounded-2xl border border-gold/25 bg-gold/5 p-5">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div>
                <p className="font-medium text-gold">Pagos online — próximamente</p>
                <p className="mt-1 text-sm text-muted">
                  Activaremos tarjeta y financiamiento cuando ANTASPC complete LLC y
                  verificación con Stripe. Tu tienda ya está lista para conectarlo.
                </p>
              </div>
            </div>
          )}

          <PaymentMethods variant="full" className="mx-auto max-w-2xl justify-center" />
        </Container>
      </section>

      <Container className="py-14 sm:py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paymentMethods.map((method) => {
            const Icon = icons[method.id as keyof typeof icons] ?? CreditCard;
            const isActive = method.status === "active";

            return (
              <article
                key={method.id}
                className={cn(
                  "rounded-2xl border p-6",
                  isActive
                    ? "border-cyan/25 bg-cyan/5"
                    : "border-border bg-surface-elevated",
                )}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className={cn(
                      "rounded-xl border p-2.5",
                      isActive
                        ? "border-cyan/25 bg-cyan/10"
                        : "border-gold/25 bg-gold/5",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-cyan" : "text-gold",
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                      isActive
                        ? "bg-cyan/15 text-cyan"
                        : "bg-gold/15 text-gold",
                    )}
                  >
                    {isActive ? "Disponible" : "Próximamente"}
                  </span>
                </div>
                <h3 className="font-semibold">{method.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {method.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface-elevated p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-cyan" />
              <h2 className="text-xl font-semibold">Compra hoy por WhatsApp</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              No necesitas esperar para tu PC. Arma tu carrito, envíanos el pedido y
              coordinamos pago y entrega en Miami contigo directamente.
            </p>
            <Button
              href={`https://wa.me/${siteConfig.whatsapp}`}
              className="mt-6 gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Escribir por WhatsApp
            </Button>
          </div>

          <div className="rounded-2xl border border-cyan/20 bg-cyan/5 p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3">
              <Building2 className="h-6 w-6 text-cyan" />
              <h2 className="text-xl font-semibold">Preparando pagos online</h2>
            </div>
            <p className="mb-4 text-sm text-muted">
              Pasos que seguiremos para activar cobros con tarjeta y financiamiento:
            </p>
            <ul className="space-y-2">
              {llcChecklist.map((step) => (
                <li key={step} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                  <span className="text-muted">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14">
          <h2 className="mb-6 text-center text-2xl font-semibold">
            Preguntas frecuentes
          </h2>
          <div className="mx-auto max-w-3xl space-y-4">
            {financingFaqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-border bg-surface-elevated p-5"
              >
                <summary className="cursor-pointer list-none font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {faq.q}
                    <span className="text-cyan transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button href="/pcs">Ver catálogo de PCs</Button>
        </div>
      </Container>
    </SiteLayout>
  );
}
