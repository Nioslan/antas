import type { Metadata } from "next";
import { Mail, Clock, MapPin, MessageCircle } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/Section";
import { FadeIn } from "@/components/ui/FadeIn";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contáctanos por WhatsApp o correo. ANTASPC en Miami: Lun – Sáb 10:00 – 19:00. Asesoría personalizada para tu próxima PC.",
};

const whatsappHref = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
  "Hola ANTASPC, quiero información."
)}`;

export default function ContactPage() {
  return (
    <SiteLayout>
      <Container className="py-8 sm:py-16">
        <FadeIn>
          <SectionHeader
            eyebrow="Contacto"
            title="Hablemos de tu próxima PC"
            description="Escríbenos por WhatsApp para respuesta rápida, o por correo si prefieres. Te asesoramos sin compromiso."
          />
        </FadeIn>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FadeIn delay={0.05}>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-1 hover:border-[#25D366]/50"
            >
              <MessageCircle className="h-8 w-8 text-[#25D366]" />
              <p className="mt-4 font-semibold">WhatsApp</p>
              <p className="mt-1 text-sm text-muted">
                Respuesta rápida, Lun – Sáb
              </p>
              <p className="mt-3 text-sm font-medium text-[#25D366]">
                Abrir chat
              </p>
            </a>
          </FadeIn>

          <FadeIn delay={0.1}>
            <a
              href={`mailto:${siteConfig.email}`}
              className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-1 hover:border-cyan/40"
            >
              <Mail className="h-8 w-8 text-cyan" />
              <p className="mt-4 font-semibold">Correo</p>
              <p className="mt-1 text-sm text-muted">{siteConfig.email}</p>
              <p className="mt-3 text-sm font-medium text-cyan">Escríbenos</p>
            </a>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6">
              <Clock className="h-8 w-8 text-gold" />
              <p className="mt-4 font-semibold">Horario</p>
              <p className="mt-1 text-sm text-muted">{siteConfig.hours}</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6">
              <MapPin className="h-8 w-8 text-gold" />
              <p className="mt-4 font-semibold">Ubicación</p>
              <p className="mt-1 text-sm text-muted">{siteConfig.address}</p>
              <div className="mt-3 flex gap-3 text-sm">
                <a
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-muted transition hover:text-foreground"
                >
                  Instagram
                </a>
                <a
                  href={siteConfig.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-muted transition hover:text-foreground"
                >
                  TikTok
                </a>
                <a
                  href={siteConfig.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-muted transition hover:text-foreground"
                >
                  Facebook
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </Container>
    </SiteLayout>
  );
}
