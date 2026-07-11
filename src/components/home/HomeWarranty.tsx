"use client";

import Link from "next/link";
import { ArrowRight, Shield, ShieldCheck } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { Section, SectionHeader } from "@/components/ui/Section";
import { homeWarranty } from "@/lib/site";
import { cn } from "@/lib/utils";

export function HomeWarranty() {
  const included = homeWarranty.filter((item) => item.id !== "extendida");
  const extended = homeWarranty.find((item) => item.id === "extendida");

  return (
    <Section id="garantia" surface>
      <FadeIn>
        <SectionHeader
          eyebrow="Respaldo ANTAS"
          title="Garantía"
          description="Cobertura clara según la línea de tu equipo. Sin letra pequeña confusa: sabes desde el día uno cuánto tiempo estás respaldado."
        />
      </FadeIn>

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="grid sm:grid-cols-3">
          {included.map((item, index) => {
            const gold = item.accent === "gold";
            return (
              <FadeIn key={item.id} delay={index * 0.06} className="h-full">
                <article
                  className={cn(
                    "relative flex h-full flex-col p-5 sm:p-6",
                    index < included.length - 1 &&
                      "border-b border-border sm:border-r sm:border-b-0",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-[2px]",
                      gold ? "bg-gold" : "bg-cyan",
                    )}
                  />

                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        "inline-flex h-10 w-10 items-center justify-center rounded-xl border",
                        gold
                          ? "border-gold/30 bg-gold/10 text-gold"
                          : "border-cyan/30 bg-cyan/10 text-cyan",
                      )}
                    >
                      <Shield className="h-4 w-4" />
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold tracking-[0.2em] uppercase",
                        gold ? "text-gold/80" : "text-cyan/80",
                      )}
                    >
                      Incluida
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-foreground sm:text-lg">
                    {item.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-3 text-3xl font-semibold tracking-tight tabular-nums",
                      gold ? "text-gold" : "text-cyan",
                    )}
                  >
                    {item.detail}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.note}
                  </p>
                </article>
              </FadeIn>
            );
          })}
        </div>

        {extended ? (
          <FadeIn delay={0.2}>
            <div className="border-t border-border bg-surface p-5 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-6">
              <div className="flex gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground sm:text-lg">
                      {extended.title}
                    </h3>
                    <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-gold uppercase">
                      Opcional
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {extended.note}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-gold tabular-nums sm:mt-0 sm:text-right">
                {extended.detail}
              </p>
            </div>
          </FadeIn>
        ) : null}
      </div>

      <FadeIn delay={0.25}>
        <Link
          href="/garantia"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-cyan transition hover:text-cyan/80"
        >
          Ver política completa
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </FadeIn>
    </Section>
  );
}
