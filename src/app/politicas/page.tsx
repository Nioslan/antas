import type { Metadata } from "next";
import Link from "next/link";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/Section";
import { FadeIn } from "@/components/ui/FadeIn";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Políticas",
  description:
    "Políticas de ANTASPC: garantía, devoluciones, privacidad y términos de compra en Miami.",
};

const whatsappHref = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
  "Hola ANTASPC, tengo una pregunta sobre sus políticas."
)}`;

function PolicySection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border/60 py-8 first:border-t-0 first:pt-0">
      <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted sm:text-base">
        {children}
      </div>
    </section>
  );
}

export default function PoliciesPage() {
  return (
    <SiteLayout>
      <Container className="py-8 sm:py-16">
        <FadeIn>
          <SectionHeader
            eyebrow="Transparencia"
            title="Nuestras políticas"
            description="Comprar con nosotros es comprar con confianza. Aquí está todo claro, sin letra pequeña."
          />
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="max-w-3xl">
            <PolicySection id="garantia" title="Garantía">
              <p>
                Todos nuestros equipos incluyen garantía escrita: 2 meses en
                línea Renew, 3 meses en líneas Hybrid y Elite. Si un componente
                falla dentro del período de cobertura por defecto de
                fabricación o ensamblado, lo reparamos o reemplazamos sin costo.
              </p>
              <p>
                Puedes extender la cobertura a 6 meses pagando un 10% del valor
                del equipo al momento de la compra. La garantía no cubre daños
                por mal uso, golpes, líquidos, sobrecargas eléctricas ni
                modificaciones no autorizadas.
              </p>
              <p>
                <Link href="/garantia" className="font-medium text-cyan hover:text-cyan/80">
                  Ver detalles de garantía
                </Link>
              </p>
            </PolicySection>

            <PolicySection id="devoluciones" title="Devoluciones">
              <p>
                Tienes 7 días naturales desde la entrega para devolver un equipo
                si no cumple lo prometido, siempre que esté en las mismas
                condiciones en que lo recibiste, con sus accesorios y empaque.
              </p>
              <p>
                Las devoluciones por arrepentimiento aplican un cargo de
                reinspección del 10%. Los servicios técnicos (limpieza,
                reparación, diagnóstico) no son reembolsables una vez
                realizados.
              </p>
              <p>
                Para iniciar una devolución escríbenos por{" "}
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#25D366]"
                >
                  WhatsApp
                </a>{" "}
                con tu número de pedido.
              </p>
            </PolicySection>

            <PolicySection id="pagos" title="Pagos">
              <p>
                Aceptamos pago por WhatsApp coordinado directamente con nuestro
                equipo. Estamos activando pagos con tarjeta y financiamiento;
                te avisaremos en cuanto estén disponibles.
              </p>
              <p>
                El programa Trade-In te permite usar tu PC actual como parte de
                pago: la valoramos de forma transparente y descontamos su valor
                de tu equipo nuevo.{" "}
                <Link href="/upgrade" className="font-medium text-cyan hover:text-cyan/80">
                  Valora tu PC aquí
                </Link>
                .
              </p>
            </PolicySection>

            <PolicySection id="privacidad" title="Privacidad">
              <p>
                Los datos que nos compartes (nombre, contacto, fotos de tu
                equipo para trade-in) se usan únicamente para atenderte:
                cotizaciones, pedidos, garantía y soporte. No vendemos ni
                compartimos tu información con terceros con fines publicitarios.
              </p>
              <p>
                Puedes pedirnos en cualquier momento que corrijamos o eliminemos
                tus datos escribiendo a {siteConfig.email}.
              </p>
            </PolicySection>

            <PolicySection id="terminos" title="Términos de compra">
              <p>
                Los precios publicados están en dólares americanos (USD) e
                incluyen la garantía indicada. Las especificaciones de cada
                equipo se confirman antes del pago; si un componente no está
                disponible, te ofrecemos un equivalente o superior, o la
                devolución total de tu dinero.
              </p>
              <p>
                Los tiempos de entrega se coordinan por WhatsApp según
                disponibilidad. ANTASPC opera en {siteConfig.address}, en
                horario {siteConfig.hours}.
              </p>
            </PolicySection>
          </div>
        </FadeIn>
      </Container>
    </SiteLayout>
  );
}
