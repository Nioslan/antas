"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
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
  const [filtersOpen, setFiltersOpen] = useState(true);

  // En móvil los filtros empiezan colapsados para ver productos primero
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setFiltersOpen(false);
    }
  }, []);

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

  const activeFilterCount = [
    type !== "all",
    category !== "all",
    line !== "all",
    brand !== "all",
    maxPrice !== "all",
    query.trim() !== "",
  ].filter(Boolean).length;

  function clearFilters() {
    setType("all");
    setCategory("all");
    setLine("all");
    setBrand("all");
    setMaxPrice("all");
    setQuery("");
  }

  return (
    <section className="relative bg-black py-8 sm:py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-cyan-glow),_transparent_55%)]" />
      <Container className="relative">
        <SectionHeader
          badge="Tienda"
          title="Catálogo"
          description="PCs, componentes y más. Filtra por tipo, uso o precio."
          align="left"
          className="mb-8 sm:mb-10"
        />

        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface/60">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-foreground"
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="h-4 w-4 text-cyan" />
              Filtros
              {activeFilterCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan px-1.5 text-[11px] font-bold text-black">
                  {activeFilterCount}
                </span>
              ) : null}
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted transition-transform",
                  filtersOpen && "rotate-180",
                )}
              />
            </button>
            {activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-muted transition hover:text-foreground"
              >
                Limpiar
              </button>
            ) : null}
          </div>

          {filtersOpen ? (
            <div className="grid gap-4 border-t border-border/60 px-4 py-4">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Buscar
                </p>
                <div className="relative">
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nombre, CPU, GPU…"
                    aria-label="Buscar en catálogo"
                    className="h-11 w-full rounded-xl border border-border bg-white/[0.03] px-4 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-cyan/40 focus:ring-1 focus:ring-cyan/25"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Tipo de producto
                </p>
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
              </div>

              {(type === "all" || type === "pc") ? (
                <>
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                      Línea
                    </p>
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
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                      Uso
                    </p>
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
                  </div>
                </>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                {brands.length > 0 ? (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                      Marca
                    </p>
                    <select
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="h-11 w-full rounded-xl border border-border bg-black px-3 text-sm text-muted outline-none focus:border-cyan/40"
                    >
                      <option value="all">Todas</option>
                      {brands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                    Precio máximo
                  </p>
                  <select
                    value={maxPrice === "all" ? "all" : String(maxPrice)}
                    onChange={(e) =>
                      setMaxPrice(e.target.value === "all" ? "all" : Number(e.target.value))
                    }
                    className="h-11 w-full rounded-xl border border-border bg-black px-3 text-sm text-muted outline-none focus:border-cyan/40"
                  >
                    <option value="all">Cualquiera</option>
                    <option value="999">Hasta $999</option>
                    <option value="1499">Hasta $1,499</option>
                    <option value="1999">Hasta $1,999</option>
                    <option value="2999">Hasta $2,999</option>
                  </select>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <p className="mb-4 text-xs text-muted">
          {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
        </p>

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
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
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
                <div className="p-3 sm:p-4">
                  <p className="text-[11px] text-muted sm:text-xs">
                    {PRODUCT_TYPE_LABELS[product.type]}
                    {product.line && ` · ${LINE_LABELS[product.line]}`}
                    {product.componentType &&
                      ` · ${COMPONENT_TYPE_LABELS[product.componentType]}`}
                  </p>
                  <h3 className="mt-1 text-sm leading-snug font-medium sm:text-base">{product.name}</h3>
                  <p className="mt-2 text-base text-cyan sm:text-lg">{formatPrice(product.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
