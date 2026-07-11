import type { Metadata } from "next";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Carrito",
};

export default function CartPage() {
  return (
    <SiteLayout>
      <CartView />
    </SiteLayout>
  );
}
