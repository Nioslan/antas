import type { Metadata } from "next";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "Contacto",
};

export default function ContactPage() {
  return (
    <SiteLayout>
      <ComingSoon
        title="Contacto"
        description="WhatsApp, correo, redes sociales y ubicación de nuestra tienda."
      />
    </SiteLayout>
  );
}
