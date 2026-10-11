import type { Metadata } from "next";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisa tu carrito y completa tu compra en ANTASPC Miami.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <SiteLayout>
      <CartView />
    </SiteLayout>
  );
}
