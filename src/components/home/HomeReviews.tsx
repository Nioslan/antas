"use client";

import { FadeIn } from "@/components/ui/FadeIn";
import { Section, SectionHeader } from "@/components/ui/Section";
import { reviews } from "@/lib/site";
import { cn } from "@/lib/utils";

export function HomeReviews() {
  return (
    <Section id="opiniones" phoneScreen={false} className="py-8 sm:py-10 lg:py-12">
      <FadeIn>
        <SectionHeader
          eyebrow="Clientes"
          title="Opiniones"
          description="Experiencias reales de quienes ya compraron en ANTAS."
          className="mb-4 sm:mb-5 lg:mb-6"
        />
      </FadeIn>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid sm:grid-cols-3">
          {reviews.map((review, index) => {
            const gold = index === 1;
            return (
              <FadeIn key={review.name} delay={index * 0.05} className="h-full">
                <blockquote
                  className={cn(
                    "relative flex h-full flex-col px-4 py-4 sm:px-5 sm:py-5",
                    index < reviews.length - 1 &&
                      "border-b border-border sm:border-r sm:border-b-0",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-[2px]",
                      gold ? "bg-gold" : "bg-cyan",
                    )}
                  />
                  <p
                    className={cn(
                      "text-lg leading-none",
                      gold ? "text-gold/50" : "text-cyan/50",
                    )}
                  >
                    “
                  </p>
                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted sm:text-[13px]">
                    {review.text}
                  </p>
                  <footer className="mt-3 flex items-center justify-between gap-2 border-t border-border/80 pt-3">
                    <span className="text-xs font-semibold text-foreground">
                      {review.name}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-medium tracking-[0.14em] uppercase",
                        gold ? "text-gold/80" : "text-cyan/80",
                      )}
                    >
                      Cliente ANTAS
                    </span>
                  </footer>
                </blockquote>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
