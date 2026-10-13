import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/inventory";

const BASE_URL = "https://www.antaspc.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "",
    "/pcs",
    "/amazonlink",
    "/servicios",
    "/financiamiento",
    "/garantia",
    "/upgrade",
    "/politicas",
    "/contacto",
  ];

  const entries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  try {
    const products = await getProducts();
    for (const product of products) {
      if (product.stock <= 0) continue;
      entries.push({
        url: `${BASE_URL}/pcs/${product.id}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // Si falla la lectura del inventario, el sitemap sale solo con páginas estáticas.
  }

  return entries;
}
