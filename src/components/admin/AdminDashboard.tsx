"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { GalleryUpload } from "@/components/admin/GalleryUpload";
import { VideoUpload } from "@/components/admin/VideoUpload";
import { AdminSales } from "@/components/admin/AdminSales";
import { AdminFinance } from "@/components/admin/AdminFinance";
import {
  CATEGORY_LABELS,
  COMPONENT_TYPE_LABELS,
  LINE_LABELS,
  PRODUCT_TYPE_LABELS,
  type ComponentType,
  type InventoryData,
  type Product,
  type ProductCategory,
  type ProductLine,
  type ProductType,
} from "@/types/inventory";
import { cn, formatPrice } from "@/lib/utils";

type AdminDashboardProps = {
  initialData: InventoryData;
};

type Tab = "sales" | "finance" | "products" | "settings";

const emptyProduct = (): Omit<Product, "id" | "createdAt" | "updatedAt"> => ({
  type: "pc",
  name: "",
  description: "",
  price: 0,
  stock: 1,
  image: "",
  images: [],
  video: "",
  line: "elite",
  category: "gaming",
  brand: "",
  specs: {},
});

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<Tab>("sales");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct());
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  function openNewForm() {
    setEditing(null);
    setForm(emptyProduct());
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditing(product.id);
    setForm({
      type: product.type,
      componentType: product.componentType,
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      stock: product.stock,
      image: product.image,
      images: product.images ?? [],
      video: product.video ?? "",
      line: product.line,
      category: product.category,
      brand: product.brand ?? "",
      specs: product.specs ?? {},
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      stock: Number(form.stock),
      price: Number(form.price),
      images: (form.images ?? []).filter(Boolean).slice(0, 5),
      video: form.type === "pc" && form.video ? form.video : undefined,
    };

    const url = editing ? `/api/products/${editing}` : "/api/products";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const saved = (await res.json()) as Product;
      setData((prev) => ({
        ...prev,
        products: editing
          ? prev.products.map((p) => (p.id === editing ? saved : p))
          : [saved, ...prev.products],
      }));
      setShowForm(false);
      setEditing(null);
    }

    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setData((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== id),
      }));
    }
  }

  async function saveSettings() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data.settings),
    });
    if (res.ok) {
      const settings = await res.json();
      setData((prev) => ({ ...prev, settings }));
    }
    setSaving(false);
  }

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.reload();
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-black px-4 py-2.5 text-sm outline-none transition-colors focus:border-cyan/50";

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-border-subtle bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold">Panel ANTAS</h1>
            <p className="text-xs text-muted">
              Ventas, finanzas, inventario y fotos
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/"
              className="rounded-full border border-border px-4 py-2 text-xs text-muted transition-colors hover:text-foreground"
            >
              Ver tienda
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-border px-4 py-2 text-xs text-muted transition-colors hover:text-foreground"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("sales")}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              tab === "sales"
                ? "bg-cyan text-black"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            Ventas
          </button>
          <button
            type="button"
            onClick={() => setTab("finance")}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              tab === "finance"
                ? "bg-cyan text-black"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            Finanzas
          </button>
          <button
            type="button"
            onClick={() => setTab("products")}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              tab === "products"
                ? "bg-cyan text-black"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            Inventario ({data.products.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("settings")}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              tab === "settings"
                ? "bg-cyan text-black"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            Logo e imágenes
          </button>
        </div>

        {tab === "sales" && (
          <AdminSales
            products={data.products}
            onStockChange={(products) =>
              setData((prev) => ({ ...prev, products }))
            }
          />
        )}

        {tab === "finance" && <AdminFinance />}

        {tab === "products" && (
          <div className="space-y-6">
            {!showForm && (
              <Button onClick={openNewForm} className="gap-2">
                <Plus className="h-4 w-4" />
                Agregar producto
              </Button>
            )}

            {showForm && (
              <form
                onSubmit={handleSave}
                className="space-y-5 rounded-2xl border border-border bg-surface-elevated p-6"
              >
                <h2 className="font-medium">
                  {editing ? "Editar producto" : "Nuevo producto"}
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted">Tipo</label>
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value as ProductType })
                      }
                      className={inputClass}
                    >
                      {Object.entries(PRODUCT_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.type === "component" && (
                    <div>
                      <label className="mb-1 block text-xs text-muted">
                        Tipo de componente
                      </label>
                      <select
                        value={form.componentType ?? "other"}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            componentType: e.target.value as ComponentType,
                          })
                        }
                        className={inputClass}
                      >
                        {Object.entries(COMPONENT_TYPE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-muted">Nombre</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputClass}
                      placeholder="Ej: ANTAS Elite RTX 4060"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-muted">Descripción</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className={cn(inputClass, "min-h-[80px] resize-none")}
                      placeholder="Descripción opcional"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted">Precio (USD)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.price || ""}
                      onChange={(e) =>
                        setForm({ ...form, price: Number(e.target.value) })
                      }
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted">Stock</label>
                    <input
                      type="number"
                      min={0}
                      value={form.stock}
                      onChange={(e) =>
                        setForm({ ...form, stock: Number(e.target.value) })
                      }
                      className={inputClass}
                      required
                    />
                  </div>

                  {form.type === "pc" && (
                    <>
                      <div>
                        <label className="mb-1 block text-xs text-muted">Línea</label>
                        <select
                          value={form.line ?? "elite"}
                          onChange={(e) =>
                            setForm({ ...form, line: e.target.value as ProductLine })
                          }
                          className={inputClass}
                        >
                          {Object.entries(LINE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted">Categoría</label>
                        <select
                          value={form.category ?? "gaming"}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              category: e.target.value as ProductCategory,
                            })
                          }
                          className={inputClass}
                        >
                          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="mb-1 block text-xs text-muted">Marca</label>
                    <input
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      className={inputClass}
                      placeholder="AMD, Intel, NVIDIA..."
                    />
                  </div>
                </div>

                {form.type === "pc" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <p className="sm:col-span-2 text-sm font-medium text-muted">
                      Especificaciones (opcional)
                    </p>
                    {(
                      [
                        ["cpu", "Procesador"],
                        ["gpu", "GPU"],
                        ["ram", "RAM"],
                        ["ssd", "SSD"],
                        ["psu", "Fuente"],
                        ["motherboard", "Motherboard"],
                        ["cooling", "Refrigeración"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key}>
                        <label className="mb-1 block text-xs text-muted">{label}</label>
                        <input
                          value={form.specs?.[key] ?? ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              specs: { ...form.specs, [key]: e.target.value },
                            })
                          }
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <ImageUpload
                  value={form.image}
                  onChange={(url) => setForm({ ...form, image: url })}
                  label="Imagen principal (portada)"
                />
                <p className="-mt-2 text-xs text-muted">
                  Esta es la primera foto que ve el cliente en el catálogo y en
                  la ficha del producto.
                </p>

                <GalleryUpload
                  value={form.images ?? []}
                  onChange={(urls) => setForm({ ...form, images: urls })}
                  label="Galería (hasta 5 fotos más)"
                />

                {form.type === "pc" ? (
                  <VideoUpload
                    value={form.video ?? ""}
                    onChange={(url) => setForm({ ...form, video: url })}
                    label="Video del build (Renew / Hybrid / Elite)"
                  />
                ) : null}

                <div className="flex gap-3">
                  <Button type="submit" disabled={saving || !form.image}>
                    {saving ? "Guardando..." : editing ? "Actualizar" : "Guardar producto"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowForm(false);
                      setEditing(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {data.products.length === 0 && !showForm && (
                <p className="rounded-xl border border-border bg-surface-elevated p-8 text-center text-sm text-muted">
                  No hay productos aún. Agrega tu primera PC, RAM o componente.
                </p>
              )}
              {data.products.map((product) => (
                <div
                  key={product.id}
                  className="flex gap-4 rounded-xl border border-border bg-surface-elevated p-4"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-black">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted">
                        Sin foto
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted">
                      {PRODUCT_TYPE_LABELS[product.type]}
                      {product.line && ` · ${LINE_LABELS[product.line]}`}
                      {product.componentType &&
                        ` · ${COMPONENT_TYPE_LABELS[product.componentType]}`}
                      {product.video ? " · Con video" : ""}
                      {(product.images?.length ?? 0) > 0
                        ? ` · ${1 + (product.images?.length ?? 0)} fotos`
                        : ""}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="text-cyan">{formatPrice(product.price)}</span>
                      <span className="text-muted"> · Stock: {product.stock}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEditForm(product)}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      className="rounded-lg p-2 text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="space-y-8 rounded-2xl border border-border bg-surface-elevated p-6">
            <div>
              <h2 className="mb-1 font-medium">Logo de ANTAS</h2>
              <p className="mb-4 text-sm text-muted">
                Aparece en la barra superior de la tienda.
              </p>
              <ImageUpload
                value={data.settings.logo}
                onChange={(url) =>
                  setData((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, logo: url },
                  }))
                }
                label="Logo"
                aspect="logo"
                className="max-w-xs"
              />
            </div>

            <div>
              <h2 className="mb-1 font-medium">Fotos de las 3 líneas (Home)</h2>
              <p className="mb-4 text-sm text-muted">
                Estas imágenes aparecen en las tarjetas Renew, Hybrid y Elite de la página
                principal.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {(["renew", "hybrid", "elite"] as const).map((line) => (
                  <ImageUpload
                    key={line}
                    value={data.settings.lineImages[line]}
                    onChange={(url) =>
                      setData((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          lineImages: { ...prev.settings.lineImages, [line]: url },
                        },
                      }))
                    }
                    label={LINE_LABELS[line]}
                    aspect="wide"
                  />
                ))}
              </div>
            </div>

            <Button onClick={saveSettings} disabled={saving}>
              {saving ? "Guardando..." : "Guardar logo e imágenes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
