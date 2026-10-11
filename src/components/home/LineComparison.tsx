import Link from "next/link";
import { Check } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { Section, SectionHeader } from "@/components/ui/Section";
import { pcLines, homeWarranty } from "@/lib/site";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

const rows: { label: string; values: [string, string, string] }[] = [
  {
    label: "Componentes",
    values: [
      "Usados certificados",
      "Nuevos + usados certificados",
      "Completamente nuevos",
    ],
  },
  {
    label: "CPU típico",
    values: ["Ryzen 5 5600", "Ryzen 7 7700X", "Ryzen 9 9950X"],
  },
  {
    label: "GPU típica",
    values: ["RTX 3060 12GB", "RTX 5070", "RTX 5090"],
  },
  {
    label: "Memoria típica",
    values: ["32GB DDR4", "32GB DDR5", "64GB DDR5"],
  },
  {
    label: "Garantía incluida",
    values: [
      homeWarranty[0].detail,
      homeWarranty[1].detail,
      homeWarranty[2].detail,
    ],
  },
  {
    label: "Ideal para",
    values: [
      "Jugar y trabajar con gran valor",
      "El mejor balance precio-rendimiento",
      "Máximo rendimiento sin límites",
    ],
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
        <div className="overflow-x-auto rounded-2xl border border-border">
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
