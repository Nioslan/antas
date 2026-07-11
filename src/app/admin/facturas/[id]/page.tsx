import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";
import { getSettings } from "@/lib/inventory";
import { InvoiceDocument } from "@/components/admin/InvoiceDocument";

export const metadata: Metadata = {
  title: "Factura",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoicePage({ params }: PageProps) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const settings = await getSettings();

  return <InvoiceDocument order={order} logoUrl={settings.logo || undefined} />;
}
