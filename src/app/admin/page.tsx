import type { Metadata } from "next";
import { readInventory } from "@/lib/inventory";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const data = await readInventory();
  return <AdminPanel initialData={data} />;
}
