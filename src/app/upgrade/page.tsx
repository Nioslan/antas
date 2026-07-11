import type { Metadata } from "next";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { UpgradeForm } from "@/components/upgrade/UpgradeForm";

export const metadata: Metadata = {
  title: "Usa tu PC como pago",
  description:
    "Trae tu computadora actual. Sube una foto y detalla tus componentes para recibir una valoración y descontarla de tu nueva PC ANTAS.",
};

export default function UpgradePage() {
  return (
    <SiteLayout>
      <UpgradeForm />
    </SiteLayout>
  );
}
