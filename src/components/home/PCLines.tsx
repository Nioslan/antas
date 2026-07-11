"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { Section, SectionHeader } from "@/components/ui/Section";
import { pcLines } from "@/lib/site";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductLine } from "@/types/inventory";

type PCLinesProps = {
  startingPrices?: Partial<Record<ProductLine, number>>;
  lineImages?: Partial<Record<ProductLine, string>>;
};

export function PCLines({
  startingPrices = {},
  lineImages = {},
}: PCLinesProps) {
  return (
    <Section id="lineas" surface>
      <FadeIn>
        <SectionHeader
          eyebrow="Líneas ANTAS"
          title="Elige tu línea"
          description="Tres caminos claros. Misma calidad. Elige según tu presupuesto y rendimiento."
        />
      </FadeIn>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {pcLines.map((line, index) => {
          const image = lineImages[line.id];
          const price = startingPrices[line.id] ?? line.priceFrom;
          const gold = line.accent === "gold";

          return (
            <FadeIn key={line.id} delay={index * 0.08}>
              <Link
                href={line.href}
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-background transition duration-300 hover:-translate-y-1",
                  gold
                    ? "border-border hover:border-gold/40"
                    : "border-border hover:border-cyan/35",
                )}
              >
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-[2px]",
                    gold ? "bg-gold" : "bg-cyan",
                  )}
                />

                <div className="relative aspect-[16/11] overflow-hidden bg-background sm:aspect-[4/3]">
                  {image ? (
                    <Image
                      src={image}
                      alt={line.name}
                      fill
                      unoptimized
                      className="object-contain p-5 transition duration-500 group-hover:scale-[1.03] sm:p-6"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-24 w-16 rounded-lg border border-border bg-surface/80 sm:h-28 sm:w-20" />
                    </div>
                  )}

                  <span
                    className={cn(
                      "absolute top-3 left-3 rounded-md border px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase backdrop-blur-md",
                      gold
                        ? "border-gold/30 bg-background/75 text-gold"
                        : "border-cyan/30 bg-background/75 text-cyan",
                    )}
                  >
                    {line.tag}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                      {line.name}
                    </h3>
                    <span
                      className={cn(
                        "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition duration-300",
                        gold
                          ? "border-gold/25 text-gold group-hover:bg-gold group-hover:text-background"
                          : "border-cyan/25 text-cyan group-hover:bg-cyan group-hover:text-background",
                      )}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {line.description}
                  </p>

                  <div className="mt-auto flex items-end justify-between border-t border-border/80 pt-4">
                    <div>
                      <p className="text-[10px] tracking-[0.2em] text-muted uppercase">
                        Desde
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-lg font-semibold tabular-nums",
                          gold ? "text-gold" : "text-cyan",
                        )}
                      >
                        {formatPrice(price)}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-muted transition group-hover:text-foreground">
                      Ver equipos
                    </span>
                  </div>
                </div>
              </Link>
            </FadeIn>
          );
        })}
      </div>
    </Section>
  );
}
