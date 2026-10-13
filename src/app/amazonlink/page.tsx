import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Package, Wrench } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { AMAZON_DISCLOSURE, affiliateUrl, readAmazon } from "@/lib/amazon";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Amazonlink",
  description:
    "Armados ANTASPC con links de Amazon: compra cada componente para armar tu PC tú mismo, o lleva un componente recomendado.",
};

export default async function AmazonlinkPage() {
  const data = await readAmazon();
  const tag = data.tag;

  return (
    <SiteLayout>
      <Container className="py-8 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
            Amazonlink
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Arma tu PC con nuestros links
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted sm:text-base">
            Publicamos fotos y videos de cada PC que armamos con los links de
            Amazon de sus componentes. Si quieres armarla tú mismo, cómpralos
            ahí — o lleva solo el componente recomendado que necesites.
          </p>
          <p className="mt-3 rounded-xl border border-border/70 bg-surface/60 px-3 py-2 text-[11px] leading-relaxed text-muted">
            {AMAZON_DISCLOSURE}
          </p>
        </div>

        {data.builds.length > 0 ? (
          <section className="mt-8 sm:mt-12">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground sm:text-xl">
              <Wrench className="h-5 w-5 text-gold" />
              Nuestros armados
            </h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {data.builds.map((build) => {
                const cover = build.images[0] ?? "";
                return (
                  <article
                    key={build.id}
                    id={build.id}
                    className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-surface-elevated"
                  >
                    {cover ? (
                      <div className="relative aspect-video bg-black">
                        
                        <Image
                          src={cover}
                          alt={build.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                      </div>
                    ) : null}
                    <div className="p-4 sm:p-5">
                      <h3 className="text-base font-semibold text-foreground sm:text-lg">
                        {build.name}
                      </h3>
                      {build.description ? (
                        <p className="mt-1 text-[13px] leading-relaxed text-muted">
                          {build.description}
                        </p>
                      ) : null}

                      {build.videos.length > 0 ? (
                        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-black">
                          <video
                            src={build.videos[0]}
                            className="aspect-video w-full object-contain"
                            controls
                            playsInline
                            preload="metadata"
                          />
                        </div>
                      ) : null}

                      {build.components.length > 0 ? (
                        <ul className="mt-4 divide-y divide-border/60 rounded-xl border border-border/60">
                          {build.components.map((c, i) => (
                            <li
                              key={i}
                              className="flex items-center justify-between gap-3 px-3 py-2.5"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-[13px] font-medium text-foreground">
                                  {c.name}
                                </p>
                                {c.price != null ? (
                                  <p className="text-xs text-muted">
                                    {formatPrice(c.price)}
                                  </p>
                                ) : null}
                              </div>
                              <a
                                href={affiliateUrl(c.url, tag)}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-xs font-bold text-black transition hover:bg-gold/90"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Amazon
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {data.products.length > 0 ? (
          <section className="mt-8 sm:mt-12">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground sm:text-xl">
              <Package className="h-5 w-5 text-cyan" />
              Componentes recomendados
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {data.products.map((p) => (
                <article
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated"
                >
                  <div className="relative aspect-square bg-black">
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 50vw, 25vw"
                      />
                    ) : null}
                    {p.badge ? (
                      <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-black">
                        {p.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    {p.category ? (
                      <p className="text-[11px] uppercase tracking-wide text-muted">
                        {p.category}
                      </p>
                    ) : null}
                    <h3 className="mt-0.5 line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
                      {p.name}
                    </h3>
                    {p.price != null ? (
                      <p className="mt-1 text-sm font-semibold text-cyan">
                        {formatPrice(p.price)}
                      </p>
                    ) : null}
                    <a
                      href={affiliateUrl(p.url, tag)}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-xs font-bold text-black transition hover:bg-gold/90"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver en Amazon
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {data.builds.length === 0 && data.products.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-muted">
              Estamos preparando los primeros armados y recomendaciones.
            </p>
            <Link
              href="/pcs"
              className="mt-4 inline-block rounded-xl bg-cyan px-5 py-2.5 text-sm font-bold text-black"
            >
              Ver PCs disponibles
            </Link>
          </div>
        ) : null}
      </Container>
    </SiteLayout>
  );
}
