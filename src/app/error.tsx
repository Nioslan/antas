"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-sm font-semibold tracking-[0.22em] text-muted">
        ALGO FALLÓ
      </p>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
        No pudimos cargar esta página
      </h1>
      <p className="mx-auto mt-4 max-w-md text-muted">
        Ocurrió un error inesperado. Intenta de nuevo o escríbenos por
        WhatsApp y te ayudamos.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
        >
          Intentar de nuevo
        </button>
        <Link
          href="/"
          className="rounded-xl border border-border px-6 py-3 text-sm font-semibold transition hover:border-gold/40"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
