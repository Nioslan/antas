import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { readAmazon } from "@/lib/amazon";

// Icono PNG sin fondo por armado (build id -> icono)
const ICONS: Record<string, string> = {
  "build-pc1-1100": "/amazon/icon-pc1.png",
  "build-pc2-1200": "/amazon/icon-pc2.png",
  "build-pc3-2300": "/amazon/icon-pc3.png",
};

function shortName(name: string) {
  return name.split("—")[0].trim();
}

function priceOf(name: string) {
  const m = name.match(/\$[\d,]+/);
  return m ? m[0] : "";
}

export async function AmazonBuilds() {
  const data = await readAmazon();
  if (data.builds.length === 0) return null;

  return (
    <Section id="armados">
      <div className="mb-3 flex items-end justify-between gap-3">
        <SectionHeader
          eyebrow="Amazonlink"
          title="Nuestros armados"
          className="mb-0"
        />
        <Link
          href="/amazonlink"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-gold hover:underline"
        >
          Ver todos
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {data.builds.slice(0, 4).map((build) => (
          <Link
            key={build.id}
            href={`/amazonlink#${build.id}`}
            className="group flex flex-col items-center rounded-xl border border-border bg-surface-elevated p-3 text-center transition hover:border-gold/60 hover:shadow-md sm:p-4"
          >
            <div className="relative h-20 w-20 transition group-hover:scale-105 sm:h-24 sm:w-24">
              <Image
                src={ICONS[build.id] ?? build.images[0] ?? ""}
                alt={build.name}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 80px, 96px"
              />
            </div>
            <p className="mt-2 text-xs font-bold text-foreground sm:text-sm">
              {shortName(build.name)}
            </p>
            <p className="text-xs font-semibold text-gold sm:text-sm">
              {priceOf(build.name)}
            </p>
            <p className="mt-0.5 text-[10px] text-muted sm:text-[11px]">
              {build.components.length} partes en Amazon
            </p>
          </Link>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] text-muted/70">
        Iconos: fotos Pexels y Wikimedia Commons (CC BY 4.0)
      </p>
    </Section>
  );
}
