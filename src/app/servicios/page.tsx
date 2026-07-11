import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Calendar,
  Cpu,
  Home,
  MessageCircle,
  Monitor,
  Settings,
  Sparkles,
  Thermometer,
  Wrench,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { serviceModes, services, type Service } from "@/lib/services";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Servicios técnicos ANTASPC en Miami: limpieza, pasta térmica, upgrade, Windows, optimización, ensamblaje y diagnóstico.",
};

const icons = {
  cpu: Cpu,
  wrench: Wrench,
  sparkles: Sparkles,
  thermometer: Thermometer,
  monitor: Monitor,
  settings: Settings,
  activity: Activity,
} as const;

function serviceWhatsApp(service: Service) {
  const text = encodeURIComponent(
    `Hola ANTAS, me interesa el servicio: ${service.name}. ¿Podemos agendar?`,
  );
  return `https://wa.me/${siteConfig.whatsapp}?text=${text}`;
}

export default function ServicesPage() {
  return (
    <SiteLayout>
      <section className="relative border-b border-border bg-background py-14 sm:py-20">
        <Container className="relative">
          <SectionHeader
            badge="Soporte técnico"
            title="Servicios"
            highlight="ANTASPC"
            description="Cada servicio con detalle claro. A domicilio o por cita en Miami."
          />

          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            {Object.entries(serviceModes).map(([key, mode]) => {
              const isHome = key === "domicilio";
              const Icon = isHome ? Home : Calendar;
              return (
                <div
                  key={key}
                  className={cn(
                    "rounded-2xl border p-5 text-center sm:p-6",
                    isHome
                      ? "border-cyan/25 bg-cyan/5"
                      : "border-gold/25 bg-gold/5",
                  )}
                >
                  <Icon
                    className={cn(
                      "mx-auto mb-3 h-7 w-7",
                      isHome ? "text-cyan" : "text-gold",
                    )}
                  />
                  <p className="font-semibold">{mode.label}</p>
                  <p className="mt-1 text-sm text-muted">{mode.description}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <Container className="py-14 sm:py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const Icon = icons[service.icon];
            const gold = index % 2 === 1;

            return (
              <article
                key={service.id}
                className={cn(
                  "flex flex-col rounded-2xl border border-border bg-surface p-6 transition duration-300",
                  gold
                    ? "hover:border-gold/40"
                    : "hover:border-cyan/35",
                )}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "rounded-xl border p-3",
                      gold
                        ? "border-gold/25 bg-gold/5 text-gold"
                        : "border-cyan/25 bg-cyan/5 text-cyan",
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {service.modes.map((mode) => (
                      <span
                        key={mode}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                          mode === "domicilio"
                            ? "bg-cyan/10 text-cyan"
                            : "bg-gold/10 text-gold",
                        )}
                      >
                        {serviceModes[mode].label}
                      </span>
                    ))}
                  </div>
                </div>

                <h2 className="text-lg font-semibold">{service.name}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {service.description}
                </p>

                <div className="mt-5 flex flex-col gap-2">
                  <Link
                    href={`/servicios/${service.id}`}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold tracking-wide uppercase transition",
                      gold
                        ? "border-gold/60 text-gold hover:bg-gold hover:text-background"
                        : "border-cyan/60 text-cyan hover:bg-cyan hover:text-background",
                    )}
                  >
                    Ver detalle
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={serviceWhatsApp(service)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan/10 px-4 py-2.5 text-xs font-semibold tracking-wide text-cyan uppercase transition hover:bg-cyan hover:text-background"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Agendar
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-14 rounded-2xl border border-border bg-surface p-8 text-center sm:p-10">
          <h2 className="text-xl font-semibold sm:text-2xl">
            ¿No encuentras lo que necesitas?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Escríbenos por WhatsApp y te ayudamos con un servicio personalizado.
          </p>
          <Button
            href={`https://wa.me/${siteConfig.whatsapp}`}
            className="mt-6 gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Contactar por WhatsApp
          </Button>
        </div>
      </Container>
    </SiteLayout>
  );
}
