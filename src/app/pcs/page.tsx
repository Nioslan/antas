import type { Metadata } from "next";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { PCSCatalog } from "@/components/pcs/PCSCatalog";
import { getProducts } from "@/lib/inventory";

export const metadata: Metadata = {
  title: "PCs",
  description:
    "Catálogo de PCs ANTASPC en Miami: líneas Renew, Hybrid y Elite para gaming, streaming y trabajo. Equipos certificados con garantía incluida.",
};

type PCsPageProps = {
  searchParams: Promise<{ linea?: string; q?: string }>;
};

export default async function PCsPage({ searchParams }: PCsPageProps) {
  const { linea, q } = await searchParams;
  const products = await getProducts();

  return (
    <SiteLayout>
      <PCSCatalog
        products={products}
        initialLine={linea}
        initialQuery={q ?? ""}
      />
    </SiteLayout>
  );
}
