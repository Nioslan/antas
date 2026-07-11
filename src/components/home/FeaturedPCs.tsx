"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import { Section, SectionHeader } from "@/components/ui/Section";
import { featuredBuilds } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

export type FeaturedPCItem = {
  id: string;
  badge: string;
  title: string;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  price: number;
  href: string;
  image?: string;
};

type FeaturedPCsProps = {
  products?: FeaturedPCItem[];
};

export function FeaturedPCs({ products }: FeaturedPCsProps) {
  const items: FeaturedPCItem[] =
    products && products.length > 0
      ? products
      : featuredBuilds.map((pc) => ({
          id: pc.id,
          badge: pc.badge,
          title: pc.title,
          cpu: pc.cpu,
          gpu: pc.gpu,
          ram: pc.ram,
          storage: pc.storage,
          price: pc.price,
          href: pc.href,
        }));

  return (
    <Section id="destacadas" surface>
      <FadeIn>
        <SectionHeader
          eyebrow="Selección"
          title="PCs destacadas"
          description="Configuraciones listas para comprar, con el equilibrio ideal entre potencia y precio."
        />
      </FadeIn>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
        {items.map((pc, index) => (
          <FadeIn key={pc.id} delay={index * 0.08}>
            <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition duration-300 hover:-translate-y-1 hover:border-cyan/35">
              <div className="relative aspect-[16/10] overflow-hidden bg-background">
                {pc.image ? (
                  <Image
                    src={pc.image}
                    alt={pc.title}
                    fill
                    unoptimized
                    className="object-contain p-4 transition duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-xs font-semibold tracking-[0.28em] text-cyan uppercase">
                      {pc.badge}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <p className="text-[10px] font-semibold tracking-[0.22em] text-cyan uppercase">
                  {pc.badge}
                </p>
                <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground">
                  {pc.title}
                </h3>

                <dl className="mt-4 space-y-2 text-sm">
                  {[
                    ["CPU", pc.cpu],
                    ["GPU", pc.gpu],
                    ["RAM", pc.ram],
                    ["SSD", pc.storage],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3">
                      <dt className="text-muted">{label}</dt>
                      <dd className="text-right text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                  <p className="text-xl font-semibold tabular-nums text-cyan">
                    {formatPrice(pc.price)}
                  </p>
                  <Link
                    href={pc.href}
                    className="inline-flex items-center gap-1 rounded-lg bg-cyan px-3.5 py-2 text-xs font-semibold text-background transition hover:bg-cyan/90"
                  >
                    Comprar
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          </FadeIn>
        ))}
      </div>
    </Section>
  );
}
