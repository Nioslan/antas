"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { GalleryUpload } from "@/components/admin/GalleryUpload";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { VideoUpload } from "@/components/admin/VideoUpload";
import type {
  AmazonBuild,
  AmazonComponent,
  AmazonData,
  AmazonProduct,
} from "@/types/amazon";

const emptyComponent: AmazonComponent = { name: "", url: "", price: null };

function newBuild(): AmazonBuild {
  const now = new Date().toISOString();
  return {
    id: `build-${Date.now()}`,
    name: "",
    description: "",
    images: [],
    videos: [],
    components: [{ ...emptyComponent }],
    createdAt: now,
    updatedAt: now,
  };
}

function newProduct(): AmazonProduct {
  const now = new Date().toISOString();
  return {
    id: `aprod-${Date.now()}`,
    name: "",
    category: "",
    image: "",
    url: "",
    price: null,
    badge: "",
    createdAt: now,
    updatedAt: now,
  };
}

const inputCls =
  "h-11 w-full rounded-xl border border-border bg-white/[0.03] px-3 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-cyan/40";
const labelCls =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted";

export function AdminAmazon() {
  const [data, setData] = useState<AmazonData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [editingBuild, setEditingBuild] = useState<AmazonBuild | null>(null);
  const [editingProduct, setEditingProduct] = useState<AmazonProduct | null>(null);

  useEffect(() => {
    fetch("/api/amazon")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ tag: "", builds: [], products: [] }));
  }, []);

  async function save(next: AmazonData) {
    setSaving(true);
    setSaved("");
    try {
      const res = await fetch("/api/amazon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error();
      const clean = (await res.json()) as AmazonData;
      setData(clean);
      setSaved("Guardado ✓");
      setTimeout(() => setSaved(""), 2500);
    } catch {
      setSaved("Error al guardar");
    }
    setSaving(false);
  }

  function update(patch: Partial<AmazonData>) {
    if (!data) return;
    const next = { ...data, ...patch };
    setData(next);
    void save(next);
  }

  if (!data) {
    return <p className="text-sm text-muted">Cargando Amazonlink…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Amazonlink</h2>
          <p className="text-xs text-muted">
            Armados con links de Amazon + componentes recomendados
          </p>
        </div>
        {saved ? (
          <span className="text-xs font-medium text-cyan">{saved}</span>
        ) : null}
      </div>

      {/* Tag de afiliado */}
      <section className="rounded-2xl border border-border bg-surface-elevated p-4">
        <label htmlFor="amazon-tag" className={labelCls}>
          Código de afiliado de Amazon
        </label>
        <input
          id="amazon-tag"
          value={data.tag}
          onChange={(e) => setData({ ...data, tag: e.target.value })}
          onBlur={() => void save(data)}
          placeholder="Ej: antaspc-20"
          className={inputCls}
        />
        <p className="mt-2 text-xs text-muted">
          Se agrega automáticamente a todos los links. Consíguelo en tu cuenta
          de Amazon Associates. Puedes pegar links normales de Amazon; el tag
          se añade solo.
        </p>
      </section>

      {/* Armados */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">
            Armados ({data.builds.length})
          </h3>
          <button
            type="button"
            onClick={() => setEditingBuild(newBuild())}
            className="inline-flex items-center gap-1.5 rounded-full bg-cyan px-4 py-2 text-xs font-bold text-black"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar armado
          </button>
        </div>

        {editingBuild ? (
          <BuildForm
            build={editingBuild}
            onChange={setEditingBuild}
            onCancel={() => setEditingBuild(null)}
            onSave={() => {
              const exists = data.builds.some((b) => b.id === editingBuild.id);
              const builds = exists
                ? data.builds.map((b) =>
                    b.id === editingBuild.id ? editingBuild : b,
                  )
                : [...data.builds, editingBuild];
              setEditingBuild(null);
              update({ builds });
            }}
          />
        ) : null}

        <div className="grid gap-3">
          {data.builds.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{b.name}</p>
                <p className="text-xs text-muted">
                  {b.images.length} fotos · {b.videos.length} videos ·{" "}
                  {b.components.length} componentes
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingBuild(b)}
                  className="rounded-full border border-border p-2 text-muted transition hover:text-foreground"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    update({
                      builds: data.builds.filter((x) => x.id !== b.id),
                    })
                  }
                  className="rounded-full border border-border p-2 text-muted transition hover:border-red-500/50 hover:text-red-400"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {data.builds.length === 0 && !editingBuild ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
              Aún no hay armados. Agrega el primero con sus fotos y links.
            </p>
          ) : null}
        </div>
      </section>

      {/* Productos recomendados */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">
            Componentes recomendados ({data.products.length})
          </h3>
          <button
            type="button"
            onClick={() => setEditingProduct(newProduct())}
            className="inline-flex items-center gap-1.5 rounded-full bg-cyan px-4 py-2 text-xs font-bold text-black"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar
          </button>
        </div>

        {editingProduct ? (
          <ProductForm
            product={editingProduct}
            onChange={setEditingProduct}
            onCancel={() => setEditingProduct(null)}
            onSave={() => {
              const exists = data.products.some(
                (p) => p.id === editingProduct.id,
              );
              const products = exists
                ? data.products.map((p) =>
                    p.id === editingProduct.id ? editingProduct : p,
                  )
                : [...data.products, editingProduct];
              setEditingProduct(null);
              update({ products });
            }}
          />
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {data.products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="truncate text-xs text-muted">
                  {[p.category, p.badge].filter(Boolean).join(" · ") ||
                    "Sin categoría"}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingProduct(p)}
                  className="rounded-full border border-border p-2 text-muted transition hover:text-foreground"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    update({
                      products: data.products.filter((x) => x.id !== p.id),
                    })
                  }
                  className="rounded-full border border-border p-2 text-muted transition hover:border-red-500/50 hover:text-red-400"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {data.products.length === 0 && !editingProduct ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted sm:col-span-2">
              Aún no hay componentes recomendados.
            </p>
          ) : null}
        </div>
      </section>

      {saving ? (
        <p className="text-xs text-muted">Guardando…</p>
      ) : null}
    </div>
  );
}

function BuildForm({
  build,
  onChange,
  onCancel,
  onSave,
}: {
  build: AmazonBuild;
  onChange: (b: AmazonBuild) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const set = (patch: Partial<AmazonBuild>) => onChange({ ...build, ...patch });

  function setComponent(i: number, patch: Partial<AmazonComponent>) {
    set({
      components: build.components.map((c, j) =>
        j === i ? { ...c, ...patch } : c,
      ),
    });
  }

  return (
    <div className="mb-4 space-y-4 rounded-2xl border border-cyan/30 bg-surface-elevated p-4">
      <div>
        <label className={labelCls}>Nombre del armado</label>
        <input
          value={build.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="ANTAS Nova — Gaming 1080p"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Descripción</label>
        <textarea
          value={build.description ?? ""}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Qué incluye y para quién es…"
          rows={2}
          className="w-full rounded-xl border border-border bg-white/[0.03] px-3 py-2.5 text-sm outline-none placeholder:text-muted/70 focus:border-cyan/40"
        />
      </div>

      <GalleryUpload
        value={build.images}
        onChange={(images) => set({ images })}
        label="Fotos del armado (hasta 12)"
      />
      <VideoUpload
        value={build.videos}
        onChange={(videos) => set({ videos })}
        label="Videos del armado (hasta 3)"
      />

      <div>
        <label className={labelCls}>Componentes con link de Amazon</label>
        <div className="space-y-2">
          {build.components.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={c.name}
                onChange={(e) => setComponent(i, { name: e.target.value })}
                placeholder="Ryzen 5 5600"
                className={`${inputCls} flex-1`}
              />
              <input
                value={c.url}
                onChange={(e) => setComponent(i, { url: e.target.value })}
                placeholder="Link de Amazon"
                className={`${inputCls} flex-[2]`}
              />
              <button
                type="button"
                onClick={() =>
                  set({
                    components: build.components.filter((_, j) => j !== i),
                  })
                }
                className="shrink-0 rounded-xl border border-border p-2.5 text-muted hover:text-red-400"
                aria-label="Quitar componente"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            set({ components: [...build.components, { ...emptyComponent }] })
          }
          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs text-muted transition hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Agregar componente
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={!build.name.trim()}
          className="rounded-xl bg-cyan px-5 py-2.5 text-sm font-bold text-black disabled:opacity-40"
        >
          Guardar armado
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border px-5 py-2.5 text-sm text-muted"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ProductForm({
  product,
  onChange,
  onCancel,
  onSave,
}: {
  product: AmazonProduct;
  onChange: (p: AmazonProduct) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const set = (patch: Partial<AmazonProduct>) =>
    onChange({ ...product, ...patch });

  return (
    <div className="mb-4 space-y-4 rounded-2xl border border-cyan/30 bg-surface-elevated p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Nombre</label>
          <input
            value={product.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="RTX 4060 8GB"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Categoría</label>
          <input
            value={product.category ?? ""}
            onChange={(e) => set({ category: e.target.value })}
            placeholder="GPU, CPU, RAM…"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Link de Amazon</label>
          <input
            value={product.url}
            onChange={(e) => set({ url: e.target.value })}
            placeholder="https://www.amazon.com/…"
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Precio (opcional)</label>
            <input
              type="number"
              min="0"
              value={product.price ?? ""}
              onChange={(e) =>
                set({ price: e.target.value === "" ? null : Number(e.target.value) })
              }
              placeholder="299"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Etiqueta</label>
            <input
              value={product.badge ?? ""}
              onChange={(e) => set({ badge: e.target.value })}
              placeholder="Oferta, Top…"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <ImageUpload
        value={product.image ?? ""}
        onChange={(image) => set({ image })}
        label="Foto del componente"
        aspect="square"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={!product.name.trim() || !product.url.trim()}
          className="rounded-xl bg-cyan px-5 py-2.5 text-sm font-bold text-black disabled:opacity-40"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border px-5 py-2.5 text-sm text-muted"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
