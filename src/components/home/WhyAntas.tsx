"use client";

import { Cpu, Headphones, ShieldCheck, Wrench } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { Section, SectionHeader } from "@/components/ui/Section";
import { whyAntas } from "@/lib/site";
import { cn } from "@/lib/utils";

const icons = [ShieldCheck, Cpu, Wrench, Headphones] as const;

/** Brand accents: cyan / gold / cyan / gold — logo pair, no rainbow mixes. */
const accents = ["cyan", "gold", "cyan", "gold"] as const;

export function WhyAntas() {
  return (
    <Section id="por-que">
      <FadeIn>
        <SectionHeader
          eyebrow="Por qué elegirnos"
          title="¿Por qué ANTAS?"
          description="Cada equipo se revisa, prueba y entrega con respaldo claro. Comprar en ANTAS es invertir en rendimiento confiable y atención profesional."
        />
      </FadeIn>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid sm:grid-cols-2">
          {whyAntas.map((item, index) => {
            const Icon = icons[index] ?? ShieldCheck;
            const accent = accents[index] ?? "cyan";
            const gold = accent === "gold";
            const isLastCol = index % 2 === 1;
            const isLastRow = index >= whyAntas.length - 2;

            return (
              <FadeIn key={item.title} delay={index * 0.05} className="h-full">
                <article
                  className={cn(
                    "group relative flex h-full flex-col gap-4 p-5 sm:p-6 lg:p-7",
                    !isLastCol && "sm:border-r sm:border-border",
                    !isLastRow && "border-b border-border",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-[2px] opacity-80 transition duration-300 group-hover:opacity-100",
                      gold ? "bg-gold" : "bg-cyan",
                    )}
                  />

                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        "inline-flex h-11 w-11 items-center justify-center rounded-xl border transition duration-300",
                        gold
                          ? "border-gold/30 bg-gold/10 text-gold group-hover:border-gold/50"
                          : "border-cyan/30 bg-cyan/10 text-cyan group-hover:border-cyan/50",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-semibold tracking-[0.24em] tabular-nums",
                        gold ? "text-gold/70" : "text-cyan/70",
                      )}
                    >
                      0{index + 1}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {item.description}
                    </p>
                  </div>
                </article>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
