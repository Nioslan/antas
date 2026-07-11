import { SiteLayout } from "@/components/layout/SiteLayout";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ProductGallery } from "@/components/pcs/ProductGallery";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { getProductById, getProducts } from "@/lib/inventory";
import { siteConfig } from "@/lib/site";
import {
  CATEGORY_LABELS,
  COMPONENT_TYPE_LABELS,
  LINE_LABELS,
  PRODUCT_TYPE_LABELS,
} from "@/types/inventory";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Producto no encontrado" };
  return { title: product.name };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const allProducts = await getProducts();
  const related = allProducts
    .filter((p) => p.id !== product.id && p.type === product.type)
    .slice(0, 3);

  const whatsappMsg = encodeURIComponent(
    `Hola, me interesa: ${product.name} (${formatPrice(product.price)})`,
  );

  const specEntries = product.specs
    ? Object.entries(product.specs).filter(([, v]) => v)
    : [];

  const specLabels: Record<string, string> = {
    cpu: "Procesador",
    gpu: "GPU",
    ram: "RAM",
    ssd: "SSD",
    psu: "Fuente",
    motherboard: "Motherboard",
    cooling: "Refrigeración",
  };

  return (
    <SiteLayout>
      <Container className="py-10 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery
            name={product.name}
            cover={product.image}
            images={product.images}
            video={product.video}
          />

          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted">
                {PRODUCT_TYPE_LABELS[product.type]}
                {product.line && ` · ${LINE_LABELS[product.line]}`}
                {product.category && ` · ${CATEGORY_LABELS[product.category]}`}
                {product.componentType &&
                  ` · ${COMPONENT_TYPE_LABELS[product.componentType]}`}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {product.name}
              </h1>
              {product.description && (
                <p className="mt-3 text-muted">{product.description}</p>
              )}
            </div>

            <p className="text-3xl font-medium text-cyan">{formatPrice(product.price)}</p>

            <p className="text-sm text-muted">
              {product.stock > 0
                ? `${product.stock} disponible${product.stock > 1 ? "s" : ""}`
                : "Agotado"}
            </p>

            <AddToCartButton
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
              line={product.line}
              disabled={product.stock === 0}
            />
            <Button
              href={`https://wa.me/${siteConfig.whatsapp}?text=${whatsappMsg}`}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>

            {specEntries.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface-elevated p-6">
                <h2 className="mb-4 font-medium">Componentes</h2>
                <dl className="space-y-3">
                  {specEntries.map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4 text-sm">
                      <dt className="text-muted">{specLabels[key] ?? key}</dt>
                      <dd className="text-right font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <p className="text-sm text-muted">
              Incluye garantía ANTAS. Soporte local incluido.
            </p>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-xl font-semibold">Productos relacionados</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/pcs/${p.id}`}
                  className="overflow-hidden rounded-xl border border-border bg-surface-elevated transition-colors hover:border-cyan/30"
                >
                  <div className="relative aspect-square bg-black">
                    {p.image && (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-cyan">{formatPrice(p.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </SiteLayout>
  );
}
