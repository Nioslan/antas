import Link from "next/link";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <SiteLayout>
      <Container className="py-24 text-center sm:py-32">
        <p className="text-sm font-semibold tracking-[0.22em] text-muted">
          ERROR 404
        </p>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
          Esta página no existe
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          La dirección que buscas no está disponible o fue movida. Te ayudamos
          a encontrar lo que necesitas.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
          >
            Volver al inicio
          </Link>
          <Link
            href="/pcs"
            className="rounded-xl border border-border px-6 py-3 text-sm font-semibold transition hover:border-gold/40"
          >
            Ver PCs
          </Link>
        </div>
      </Container>
    </SiteLayout>
  );
}
