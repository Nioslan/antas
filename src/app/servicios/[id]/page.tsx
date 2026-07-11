import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Calendar,
  Check,
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
import {
  getServiceById,
  serviceModes,
  services,
} from "@/lib/services";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const icons = {
  cpu: Cpu,
  wrench: Wrench,
  sparkles: Sparkles,
  thermometer: Thermometer,
  monitor: Monitor,
  settings: Settings,
  activity: Activity,
} as const;

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return services.map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const service = getServiceById(id);
  if (!service) return { title: "Servicio" };
  return {
    title: service.name,
    description: service.description,
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const service = getServiceById(id);
  if (!service) notFound();

  const Icon = icons[service.icon];
  const whatsapp = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
    `Hola ANTAS, me interesa el servicio: ${service.name}. ¿Podemos agendar?`,
  )}`;

  return (
    <SiteLayout>
      <section className="border-b border-border bg-background py-10 sm:py-14">
        <Container className="max-w-3xl">
          <Link
            href="/servicios"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition hover:text-cyan"
          >
            <ArrowLeft className="h-4 w-4" />
            Todos los servicios
          </Link>

          <div className="flex items-start gap-4">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan/25 bg-cyan/10 text-cyan">
              <Icon className="h-7 w-7" />
            </span>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.28em] text-cyan uppercase">
                Servicio ANTAS
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                {service.name}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted">
                {service.description}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {service.modes.map((mode) => (
              <span
                key={mode}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                  mode === "domicilio"
                    ? "bg-cyan/10 text-cyan"
                    : "bg-gold/10 text-gold",
                )}
              >
                {mode === "domicilio" ? (
                  <Home className="h-3.5 w-3.5" />
                ) : (
                  <Calendar className="h-3.5 w-3.5" />
                )}
                {serviceModes[mode].label}
              </span>
            ))}
          </div>
        </Container>
      </section>

      <Container className="max-w-3xl py-10 sm:py-14">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-cyan uppercase">
              Ideal para
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {service.idealFor}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-gold uppercase">
              Resumen
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {service.summary}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Qué incluye este servicio
          </h2>
          <ul className="mt-4 space-y-3">
            {service.includes.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-muted">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Cómo lo hacemos
          </h2>
          <ul className="mt-4 space-y-3">
            {service.details.map((item, index) => (
              <li key={item} className="flex gap-3 text-sm text-muted">
                <span className="mt-0.5 text-[11px] font-semibold tracking-[0.16em] text-gold tabular-nums">
                  0{index + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button href={whatsapp} className="gap-2 sm:flex-1">
            <MessageCircle className="h-4 w-4" />
            Agendar por WhatsApp
          </Button>
          <Button href="/servicios" variant="outline" className="sm:flex-1">
            Ver más servicios
          </Button>
        </div>
      </Container>
    </SiteLayout>
  );
}
