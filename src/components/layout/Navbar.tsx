"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Menu, ShoppingCart, X } from "lucide-react";
import { CartLink } from "@/components/cart/CartLink";
import { NavSearch } from "@/components/layout/NavSearch";
import { TikTokIcon } from "@/components/ui/TikTokIcon";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type NavbarProps = {
  logoUrl?: string;
};

const primaryLinks = [
  { href: "/", label: "Inicio" },
  { href: "/pcs?linea=renew", label: "PC Renew" },
  { href: "/pcs?linea=hybrid", label: "PC Hybrid" },
  { href: "/pcs?linea=elite", label: "PC Elite" },
  { href: "/servicios", label: "Servicios" },
] as const;

const secondaryLinks = [
  { href: "/upgrade", label: "Trade-In" },
  { href: "/contacto", label: "Contacto" },
] as const;

function linkActive(pathname: string, href: string, linea?: string | null) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/pcs?linea=")) {
    const target = href.split("linea=")[1];
    return pathname.startsWith("/pcs") && linea === target;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavbarInner({ logoUrl }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const linea = searchParams.get("linea");

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[var(--nav-h)] max-w-6xl items-center gap-2.5 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={siteConfig.name}
              width={36}
              height={36}
              className="h-7 w-auto object-contain sm:h-8"
              unoptimized
            />
          ) : null}
          <span className="text-sm font-semibold tracking-[0.22em] text-foreground">
            {siteConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {primaryLinks.map((link) => {
            const active = linkActive(pathname, link.href, linea);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[13px] whitespace-nowrap transition lg:px-3",
                  active
                    ? "bg-cyan/10 font-medium text-cyan"
                    : "text-muted hover:bg-white/[0.04] hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
          <NavSearch className="hidden w-[10.5rem] sm:block md:w-[12.5rem] lg:w-[15rem]" />

          <a
            href={siteConfig.social.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok de ANTAS"
            className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-white/[0.03] px-2.5 py-1.5 text-muted transition hover:border-cyan/40 hover:bg-cyan/10 hover:text-cyan sm:px-3"
          >
            <TikTokIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden text-[11px] font-semibold tracking-[0.14em] uppercase sm:inline">
              TikTok
            </span>
          </a>

          <CartLink className="rounded-lg p-2 text-muted transition hover:bg-white/[0.04] hover:text-foreground">
            <ShoppingCart className="h-5 w-5" />
          </CartLink>

          <button
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="rounded-lg p-2 text-foreground transition hover:bg-white/[0.04]"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-border bg-background transition-all duration-300",
          open
            ? "max-h-[min(75dvh,36rem)] overflow-y-auto opacity-100"
            : "max-h-0 overflow-hidden border-transparent opacity-0",
        )}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8">
          <NavSearch
            className="w-full sm:hidden"
            onSubmit={() => setOpen(false)}
          />

          <div className="flex flex-col md:hidden">
            <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.22em] text-muted uppercase">
              Tienda
            </p>
            {primaryLinks.map((link) => {
              const active = linkActive(pathname, link.href, linea);
              return (
                <Link
                  key={`m-${link.label}`}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-3 text-sm transition",
                    active
                      ? "bg-cyan/10 font-medium text-cyan"
                      : "text-muted hover:bg-white/[0.04] hover:text-cyan",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className={cn("flex flex-col", "md:border-0")}>
            <p className="px-3 pb-1 text-[10px] font-semibold tracking-[0.22em] text-muted uppercase md:hidden">
              Más
            </p>
            <div className="flex flex-col md:flex-row md:flex-wrap md:gap-1">
              {secondaryLinks.map((link) => {
                const active = linkActive(pathname, link.href);
                return (
                  <Link
                    key={`m-${link.href}`}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-3 text-sm transition md:py-2",
                  active
                    ? "bg-cyan/10 font-medium text-cyan"
                    : "text-muted hover:bg-white/[0.04] hover:text-cyan",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Navbar({ logoUrl }: NavbarProps) {
  return (
    <Suspense fallback={<NavbarShell logoUrl={logoUrl} />}>
      <NavbarInner logoUrl={logoUrl} />
    </Suspense>
  );
}

function NavbarShell({ logoUrl }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[var(--nav-h)] max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={siteConfig.name}
              width={36}
              height={36}
              className="h-7 w-auto object-contain sm:h-8"
              unoptimized
            />
          ) : null}
          <span className="text-sm font-semibold tracking-[0.22em] text-foreground">
            {siteConfig.name}
          </span>
        </Link>
      </div>
    </header>
  );
}
