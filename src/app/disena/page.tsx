import type { Metadata } from "next";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = {
  title: "Diseña tu PC",
  description: "Configura tu PC ANTAS a medida.",
};

export default function DisenaPage() {
  return (
    <SiteLayout>
      <ComingSoon
        title="Diseña tu PC"
        description="El configurador de componentes estará disponible pronto. Mientras tanto, explora nuestras líneas Renew, Hybrid y Elite."
      />
    </SiteLayout>
  );
}
