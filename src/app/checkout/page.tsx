import type { Metadata } from "next";
import { MessageCircle, Lock } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PaymentMethods } from "@/components/payments/PaymentMethods";
import { paymentsConfig } from "@/lib/payments";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  if (paymentsConfig.onlinePaymentsEnabled) {
    return (
      <SiteLayout>
        <Container className="py-20 text-center">
          <p className="text-muted">Checkout online — en construcción con Stripe.</p>
        </Container>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="relative bg-background py-16 sm:py-24">
        <Container className="relative mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 inline-flex rounded-full border border-cyan/25 bg-cyan/5 p-4">
            <Lock className="h-8 w-8 text-cyan" />
          </div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Checkout online</h1>
          <p className="mt-3 text-muted">
            Pagos con tarjeta, Klarna y Affirm se activarán cuando ANTASPC complete
            LLC y verificación con Stripe.
          </p>

          <PaymentMethods variant="full" className="mt-8 justify-center" />

          <div className="mt-8 flex flex-col gap-3">
            <Button href="/carrito">Volver al carrito</Button>
            <Button
              href={`https://wa.me/${siteConfig.whatsapp}`}
              variant="amber"
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Comprar por WhatsApp
            </Button>
            <Button href="/financiamiento" variant="ghost">
              Ver opciones de financiamiento
            </Button>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
}
