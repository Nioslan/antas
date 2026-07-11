"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Cpu,
  Monitor,
  Settings2,
  Sparkles,
  Thermometer,
  Wrench,
} from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { Section, SectionHeader } from "@/components/ui/Section";
import { services } from "@/lib/services";
import { cn } from "@/lib/utils";

const icons = {
  sparkles: Sparkles,
  thermometer: Thermometer,
  wrench: Wrench,
  monitor: Monitor,
  settings: Settings2,
  cpu: Cpu,
  activity: Activity,
} as const;

export function HomeServices() {
  return (
    <Section id="servicios" surface>
      <FadeIn>
        <div className="mb-6 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow="Soporte técnico"
            title="Servicios"
            description="Mantenimiento, upgrades y diagnóstico con estándar profesional. Cada servicio con detalle claro."
            className="mb-0"
          />
          <Link
            href="/servicios"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan px-5 text-sm font-semibold text-background transition hover:bg-cyan/90"
          >
            Ver todos los servicios
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {services.map((service, index) => {
          const Icon = icons[service.icon];
          const gold = index % 2 === 1;

          return (
            <FadeIn key={service.id} delay={index * 0.04}>
              <Link
                href={`/servicios/${service.id}`}
                className={cn(
                  "group flex h-full flex-col rounded-2xl border bg-background p-4 transition duration-300 hover:-translate-y-0.5 sm:p-5",
                  gold
                    ? "border-border hover:border-gold/40"
                    : "border-border hover:border-cyan/35",
                )}
              >
                <div
                  className={cn(
                    "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border",
                    gold
                      ? "border-gold/25 bg-gold/10 text-gold"
                      : "border-cyan/25 bg-cyan/10 text-cyan",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground sm:text-base">
                  {service.shortName}
                </h3>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted sm:text-sm">
                  {service.summary}
                </p>
                <span
                  className={cn(
                    "mt-4 inline-flex items-center gap-1 text-xs font-medium",
                    gold ? "text-gold" : "text-cyan",
                  )}
                >
                  Ver detalle
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </FadeIn>
          );
        })}
      </div>
    </Section>
  );
}
