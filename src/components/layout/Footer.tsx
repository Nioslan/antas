import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/site";
import { Container } from "@/components/ui/Container";

const infoLinks = [
  { href: "/garantia", label: "Garantía" },
  { href: "/financiamiento", label: "Políticas" },
  { href: "/contacto", label: "Contacto" },
] as const;

type FooterProps = {
  logoUrl?: string;
};

export function Footer({ logoUrl }: FooterProps) {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="py-10 sm:py-14">
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4">
          <div>
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={siteConfig.name}
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
                unoptimized
              />
            ) : (
              <p className="text-sm font-semibold tracking-[0.22em]">
                {siteConfig.name}
              </p>
            )}
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {siteConfig.description}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Contacto</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <a
                  href={`https://wa.me/${siteConfig.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-cyan"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="transition hover:text-cyan"
                >
                  {siteConfig.email}
                </a>
              </li>
              <li>{siteConfig.address}</li>
              <li>{siteConfig.hours}</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Redes</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <a
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-cyan"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-cyan"
                >
                  TikTok
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-cyan"
                >
                  Facebook
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Información</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition hover:text-cyan"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-border pt-6 text-center text-xs text-muted sm:flex-row sm:justify-between sm:text-left">
          <p>
            © {new Date().getFullYear()} {siteConfig.brand}. Todos los derechos
            reservados.
          </p>
          <Link
            href="/admin"
            className="text-[11px] text-muted/70 transition hover:text-cyan"
          >
            Panel admin
          </Link>
        </div>
      </Container>
    </footer>
  );
}
