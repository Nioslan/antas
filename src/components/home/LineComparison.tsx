import Link from "next/link";
import { Check } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { Section, SectionHeader } from "@/components/ui/Section";
import { pcLines } from "@/lib/site";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const rows: { label: string; values: [string, string, string] }[] = [
  {
    label: "Componentes",
    values: [
      "Usados certificados",
      "Usados certificados + partes nuevas",
      "Totalmente nuevos",
    ],
  },
  {
    label: "Garantía incluida",
    values: ["2 meses", "3 meses", "3 meses"],
  },
];

export function LineComparison() {
  return (
    <Section>
      <FadeIn>
        <SectionHeader
          eyebrow="Comparativa"
          title="Renew vs Hybrid vs Elite"
          description="Compara lado a lado y elige la línea que va con tu presupuesto y tu forma de jugar o trabajar."
          accent="gold"
        />
      </FadeIn>

      <FadeIn delay={0.1}>
        {/* En móvil: tarjetas apiladas, sin scroll lateral */}
        <div className="grid gap-3 md:hidden">
          {pcLines.map((line, li) => (
            <div
              key={line.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface-elevated"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
                <div>
                  <p className="font-semibold text-foreground">{line.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Desde {formatPrice(line.priceFrom)}
                  </p>
                </div>
                <Link
                  href={line.href}
                  className="shrink-0 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold transition hover:border-gold/40 hover:text-gold"
                >
                  Ver {line.name}
                </Link>
              </div>
              <dl>
                {rows.map((row, i) => (
                  <div
                    key={row.label}
                    className={cn(
                      "flex items-start justify-between gap-3 px-4 py-2.5",
                      i % 2 === 1 && "bg-surface/50",
                    )}
                  >
                    <dt className="shrink-0 text-xs font-medium text-muted">
                      {row.label}
                    </dt>
                    <dd className="text-right text-xs text-foreground">
                      {row.values[li]}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        {/* En escritorio: tabla comparativa */}
        <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-surface">
                <th className="px-3 py-3 font-medium text-muted sm:px-6 sm:py-4">
                  <span className="sr-only">Característica</span>
                </th>
                {pcLines.map((line) => (
                  <th key={line.id} className="px-3 py-3 sm:px-6 sm:py-4">
                    <p className="font-semibold text-foreground">{line.name}</p>
                    <p className="mt-1 text-xs font-normal text-muted">
                      Desde {formatPrice(line.priceFrom)}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.label}
                  className={cn(i % 2 === 1 && "bg-surface/50")}
                >
                  <th
                    scope="row"
                    className="px-3 py-3 font-medium text-muted sm:px-6 sm:py-3.5"
                  >
                    {row.label}
                  </th>
                  {row.values.map((value, j) => (
                    <td key={j} className="px-3 py-3 text-foreground sm:px-6 sm:py-3.5">
                      <span className="inline-flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                        {value}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-surface/50">
                <th scope="row" className="px-3 py-3 sm:px-6 sm:py-4">
                  <span className="sr-only">Acción</span>
                </th>
                {pcLines.map((line) => (
                  <td key={line.id} className="px-3 py-3 sm:px-6 sm:py-4">
                    <Link
                      href={line.href}
                      className="inline-block rounded-xl border border-border px-4 py-2 text-xs font-semibold transition hover:border-gold/40 hover:text-gold"
                    >
                      Ver {line.name}
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </FadeIn>
    </Section>
  );
}
