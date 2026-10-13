import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { readAmazon } from "@/lib/amazon";

export async function AmazonBuilds() {
  const data = await readAmazon();
  if (data.builds.length === 0) return null;

  return (
    <Section id="armados">
      <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
        <SectionHeader
          eyebrow="Amazonlink"
          title="Nuestros armados"
          description="Las PCs que armamos, con los links de Amazon de cada componente para que la armes tú mismo."
          className="mb-0"
        />
        <Link
          href="/amazonlink"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gold hover:underline"
        >
          Ver todos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
        {data.builds.slice(0, 3).map((build) => {
          const cover = build.images[0] ?? "";
          return (
            <Link
              key={build.id}
              href="/amazonlink"
              className="group overflow-hidden rounded-2xl border border-border bg-surface-elevated transition hover:border-gold/50"
            >
              {cover ? (
                <div className="relative aspect-video bg-black">
                  <Image
                    src={cover}
                    alt={build.name}
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ) : null}
              <div className="p-3 sm:p-4">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground sm:text-base">
                  <Wrench className="h-4 w-4 shrink-0 text-gold" />
                  <span className="truncate">{build.name}</span>
                </h3>
                <p className="mt-1 text-xs text-muted sm:text-[13px]">
                  {build.components.length} componentes con link de Amazon
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
