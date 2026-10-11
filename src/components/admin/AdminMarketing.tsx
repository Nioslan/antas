"use client";

import { useMemo, useState } from "react";
import { Copy, Check, MessageCircle, Link2, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/lib/site";
import type { Product } from "@/types/inventory";

type AdminMarketingProps = {
  products: Product[];
};

const BASE_URL = "https://www.antaspc.com";

function buildTrackedUrl(
  productId: string,
  source: string,
  medium: string,
  campaign: string,
): string {
  const params = new URLSearchParams();
  if (source.trim()) params.set("utm_source", source.trim());
  if (medium.trim()) params.set("utm_medium", medium.trim());
  if (campaign.trim()) params.set("utm_campaign", campaign.trim());
  const query = params.toString();
  return `${BASE_URL}/pcs/${productId}${query ? `?${query}` : ""}`;
}

export function AdminMarketing({ products }: AdminMarketingProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [utmSource, setUtmSource] = useState("instagram");
  const [utmMedium, setUtmMedium] = useState("social");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [promoProductId, setPromoProductId] = useState("");
  const [promoDiscount, setPromoDiscount] = useState("10");

  const sellable = useMemo(
    () => products.filter((p) => p.stock > 0),
    [products],
  );

  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const promoProduct = products.find((p) => p.id === promoProductId);
  const promoMessage = useMemo(() => {
    if (!promoProduct) return "";
    const discount = Math.min(90, Math.max(1, Number(promoDiscount) || 0));
    const newPrice = Math.round(promoProduct.price * (1 - discount / 100));
    const specs = [
      promoProduct.specs?.cpu,
      promoProduct.specs?.gpu,
      promoProduct.specs?.ram,
    ]
      .filter(Boolean)
      .join(" · ");
    return (
      `🔥 OFERTA ANTASPC 🔥\n\n` +
      `${promoProduct.name}${specs ? `\n${specs}` : ""}\n\n` +
      `Antes: ${formatPrice(promoProduct.price)}\n` +
      `HOY: ${formatPrice(newPrice)} (${discount}% OFF)\n\n` +
      `✅ Garantía incluida\n` +
      `📍 Miami — entrega coordinada\n\n` +
      `Escríbenos por WhatsApp: https://wa.me/${siteConfig.whatsapp}\n` +
      `Ver equipo: ${BASE_URL}/pcs/${promoProduct.id}`
    );
  }, [promoProduct, promoDiscount]);

  const inputClass =
    "w-full rounded-xl border border-border bg-black px-4 py-2.5 text-sm outline-none transition-colors focus:border-cyan/50";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-muted uppercase">
          <Tag className="h-4 w-4 text-gold" />
          Generador de ofertas para WhatsApp
        </h2>
        <p className="mt-1 text-xs text-muted">
          Arma un mensaje de oferta en segundos y pégalo en tus estados o
          chats.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_8rem]">
          <label className="block space-y-1.5">
            <span className="text-xs text-muted">Producto</span>
            <select
              className={inputClass}
              value={promoProductId}
              onChange={(e) => setPromoProductId(e.target.value)}
            >
              <option value="">Seleccionar producto</option>
              {sellable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatPrice(p.price)}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted">Descuento %</span>
            <input
              type="number"
              min={1}
              max={90}
              className={inputClass}
              value={promoDiscount}
              onChange={(e) => setPromoDiscount(e.target.value)}
            />
          </label>
        </div>
        {promoMessage ? (
          <div className="mt-3">
            <pre className="rounded-xl border border-border/60 bg-black/40 p-4 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
              {promoMessage}
            </pre>
            <Button
              type="button"
              className="mt-3 gap-2"
              onClick={() => void copyText("promo", promoMessage)}
            >
              {copied === "promo" ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied === "promo" ? "¡Copiado!" : "Copiar mensaje"}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-muted uppercase">
          <Link2 className="h-4 w-4 text-cyan" />
          Enlaces con seguimiento (UTM)
        </h2>
        <p className="mt-1 text-xs text-muted">
          Etiqueta tus enlaces para saber qué publicación trae visitas cuando
          actives Analytics.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="text-xs text-muted">Fuente</span>
            <input
              className={inputClass}
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              placeholder="instagram"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted">Medio</span>
            <input
              className={inputClass}
              value={utmMedium}
              onChange={(e) => setUtmMedium(e.target.value)}
              placeholder="social"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-muted">Campaña</span>
            <input
              className={inputClass}
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              placeholder="oferta-octubre"
            />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-[0.14em] text-muted uppercase">
          Productos para promocionar ({sellable.length})
        </h2>
        {sellable.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            No hay productos con stock para promocionar.
          </p>
        ) : (
          <div className="space-y-2">
            {sellable.map((p) => {
              const tracked = buildTrackedUrl(
                p.id,
                utmSource,
                utmMedium,
                utmCampaign,
              );
              const waText = encodeURIComponent(
                `Mira este equipo de ANTASPC:\n${p.name} — ${formatPrice(p.price)}\n${tracked}`,
              );
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-border bg-surface px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted">
                        {formatPrice(p.price)} · Stock: {p.stock}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void copyText(`link-${p.id}`, tracked)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-cyan/40 hover:text-cyan"
                      >
                        {copied === `link-${p.id}` ? (
                          <Check className="h-3.5 w-3.5 text-cyan" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copied === `link-${p.id}` ? "¡Copiado!" : "Copiar enlace"}
                      </button>
                      <a
                        href={`https://wa.me/?text=${waText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-1.5 text-xs text-[#25D366] transition hover:bg-[#25D366]/20"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                  <p className="mt-2 truncate font-mono text-[11px] text-muted">
                    {tracked}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
