"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Camera, Wallet } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { Section, SectionHeader } from "@/components/ui/Section";

const steps = [
  {
    icon: Camera,
    title: "Envíanos tu PC",
    text: "Cuéntanos el estado y los componentes de tu equipo actual.",
  },
  {
    icon: BadgeCheck,
    title: "La valoramos",
    text: "Revisión clara, sin compromiso y con precio transparente.",
  },
  {
    icon: Wallet,
    title: "Se descuenta",
    text: "Ese valor se aplica directo a tu nueva ANTAS.",
  },
] as const;

export function UpgradeSection() {
  return (
    <Section id="tradein">
      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <FadeIn>
          <SectionHeader
            accent="gold"
            eyebrow="Trade-In"
            title="Usa tu PC como parte de pago"
            description="Trae tu computadora actual. Nosotros la valoramos y ese valor se descuenta de tu nueva ANTAS."
            className="mb-0"
          />

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
            <Link
              href="/upgrade"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-gold/65 bg-gold/10 px-6 text-[13px] font-extrabold tracking-[0.12em] text-gold uppercase transition duration-300 hover:-translate-y-0.5 hover:bg-gold hover:text-background"
            >
              Valorar mi PC
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <p className="text-center text-xs text-muted sm:text-left">
              Sin compromiso · Respuesta rápida
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="h-[2px] bg-gold" />
            <div className="divide-y divide-border/80">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="flex gap-4 px-4 py-4 sm:gap-5 sm:px-5 sm:py-5"
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-background text-gold">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold tracking-[0.2em] text-gold uppercase">
                          0{index + 1}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground sm:text-base">
                          {step.title}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">
                        {step.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}
