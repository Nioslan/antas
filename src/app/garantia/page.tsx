import type { Metadata } from "next";
import Link from "next/link";
import { Shield, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WARRANTY_POLICY } from "@/lib/warranty";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Política de Garantía",
  description:
    "Conoce la garantía incluida en PC Elite y PC Renew, y la garantía extendida de 6 meses de ANTASPC.",
};

export default function GarantiaPage() {
  return (
    <SiteLayout>
      <div className="relative border-b border-border bg-background py-12 sm:py-16">
        <Container className="relative max-w-3xl">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-cyan/25 bg-cyan/5 p-3">
              <Shield className="h-7 w-7 text-cyan" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan">
                ANTASPC
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                {WARRANTY_POLICY.title}
              </h1>
              <p className="mt-3 text-muted">{WARRANTY_POLICY.intro}</p>
            </div>
          </div>
        </Container>
      </div>

      <Container className="max-w-3xl py-12 sm:py-16">
        <div className="space-y-6">
          {WARRANTY_POLICY.sections.map((section, index) => {
            const isHighlight = "highlight" in section && section.highlight;
            const isWarning = "warning" in section && section.warning;

            return (
            <article
              key={section.title}
              className={cn(
                "rounded-2xl border p-6 sm:p-8",
                isHighlight
                  ? "border-cyan/20 bg-cyan/5"
                  : isWarning
                    ? "border-red-500/20 bg-red-500/5"
                    : "border-border bg-surface-elevated",
              )}
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-xs font-medium text-muted">
                  {index + 1}
                </span>
                <h2 className="text-lg font-semibold">{section.title}</h2>
              </div>

              {"intro" in section && section.intro && (
                <p className="mb-3 text-sm text-muted">{section.intro}</p>
              )}

              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                    <span
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                        isWarning ? "bg-red-400" : "bg-cyan",
                      )}
                    />
                    <span className={isWarning ? "text-muted" : "text-foreground/90"}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-surface-elevated p-6 text-center sm:p-8">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-cyan" />
          <p className="text-sm text-muted">
            ¿Quieres agregar la garantía extendida de 6 meses? Puedes seleccionarla
            al finalizar tu compra en el carrito.
          </p>
          <Button href="/carrito" className="mt-4">
            Ir al carrito
          </Button>
        </div>
      </Container>
    </SiteLayout>
  );
}
