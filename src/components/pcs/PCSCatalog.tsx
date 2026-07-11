"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { chipClass, cardHoverClass } from "@/lib/styles";
import {
  CATEGORY_LABELS,
  COMPONENT_TYPE_LABELS,
  LINE_LABELS,
  PRODUCT_TYPE_LABELS,
  type Product,
  type ProductCategory,
  type ProductLine,
  type ProductType,
} from "@/types/inventory";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PCSCatalogProps = {
  products: Product[];
  initialLine?: string;
  initialQuery?: string;
};

const typeFilters: { value: ProductType | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pc", label: "PCs" },
  { value: "component", label: "Componentes" },
  { value: "other", label: "Otros" },
];

const categoryFilters: { value: ProductCategory | "all"; label: string }[] = [
  { value: "all", label: "Todos los usos" },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value: value as ProductCategory,
    label,
  })),
];

const lineFilters: { value: ProductLine | "all"; label: string }[] = [
  { value: "all", label: "Todas las líneas" },
  ...Object.entries(LINE_LABELS).map(([value, label]) => ({
    value: value as ProductLine,
    label,
  })),
];

export function PCSCatalog({
  products,
  initialLine,
  initialQuery = "",
}: PCSCatalogProps) {
  const [type, setType] = useState<ProductType | "all">("all");
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [line, setLine] = useState<ProductLine | "all">(
    (initialLine as ProductLine) || "all",
  );
  const [brand, setBrand] = useState("all");
  const [maxPrice, setMaxPrice] = useState<number | "all">("all");
  const [query, setQuery] = useState(initialQuery);

  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (type !== "all" && p.type !== type) return false;
      if (category !== "all" && p.category !== category) return false;
      if (line !== "all" && p.line !== line) return false;
      if (brand !== "all" && p.brand !== brand) return false;
      if (maxPrice !== "all" && p.price > maxPrice) return false;
      if (q) {
        const haystack = [
          p.name,
          p.description,
          p.brand,
          p.line,
          p.specs?.cpu,
          p.specs?.gpu,
          p.specs?.ram,
          p.specs?.ssd,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [products, type, category, line, brand, maxPrice, query]);

  const filterChip = chipClass;

  return (
    <section className="relative bg-black py-10 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-cyan-glow),_transparent_55%)]" />
      <Container className="relative">
        <SectionHeader
          badge="Tienda"
          title="Catálogo"
          description="PCs, componentes y más. Filtra por tipo, uso o precio."
          align="left"
          className="mb-8 sm:mb-10"
        />

        <div className="mb-8 space-y-4">
          <div className="relative max-w-md">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, CPU, GPU…"
              aria-label="Buscar en catálogo"
              className="h-11 w-full rounded-xl border border-border bg-white/[0.03] px-4 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-cyan/40 focus:ring-1 focus:ring-cyan/25"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {typeFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setType(f.value)}
                className={filterChip(type === f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {(type === "all" || type === "pc") && (
            <>
              <div className="flex flex-wrap gap-2">
                {categoryFilters.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setCategory(f.value)}
                    className={filterChip(category === f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {lineFilters.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setLine(f.value)}
                    className={filterChip(line === f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {brands.length > 0 && (
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="rounded-full border border-border bg-black px-3 py-1.5 text-xs text-muted outline-none"
              >
                <option value="all">Todas las marcas</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}
            <select
              value={maxPrice === "all" ? "all" : String(maxPrice)}
              onChange={(e) =>
                setMaxPrice(e.target.value === "all" ? "all" : Number(e.target.value))
              }
              className="rounded-full border border-border bg-black px-3 py-1.5 text-xs text-muted outline-none"
            >
              <option value="all">Cualquier precio</option>
              <option value="999">Hasta $999</option>
              <option value="1499">Hasta $1,499</option>
              <option value="1999">Hasta $1,999</option>
              <option value="2999">Hasta $2,999</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-elevated p-12 text-center">
            <p className="text-muted">No hay productos con estos filtros.</p>
            <p className="mt-2 text-sm text-muted-dark">
              Agrega inventario desde{" "}
              <Link href="/admin" className="text-cyan hover:underline">
                /admin
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <Link
                key={product.id}
                href={`/pcs/${product.id}`}
                className={cn(
                  "group overflow-hidden rounded-2xl border border-border bg-surface-elevated",
                  cardHoverClass("cyan"),
                )}
              >
                <div className="relative aspect-square bg-black">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted">
                      Sin imagen
                    </div>
                  )}
                  {product.stock === 0 && (
                    <span className="absolute left-3 top-3 rounded-full bg-red-500/90 px-2 py-0.5 text-xs font-medium text-white">
                      Agotado
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted">
                    {PRODUCT_TYPE_LABELS[product.type]}
                    {product.line && ` · ${LINE_LABELS[product.line]}`}
                    {product.componentType &&
                      ` · ${COMPONENT_TYPE_LABELS[product.componentType]}`}
                  </p>
                  <h3 className="mt-1 font-medium leading-snug">{product.name}</h3>
                  <p className="mt-2 text-lg text-cyan">{formatPrice(product.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
