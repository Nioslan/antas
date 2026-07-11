"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

type HeroProps = {
  imageUrl?: string;
};

export function Hero({ imageUrl = "/images/hero-banner.png" }: HeroProps) {
  return (
    <section className="relative isolate flex min-h-[var(--phone-section)] overflow-hidden bg-background sm:min-h-[560px] lg:min-h-[640px]">
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt="ANTAS — La PC que imaginas"
          fill
          priority
          unoptimized
          className="object-contain object-center"
          sizes="100vw"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-4 pb-8 sm:px-6 sm:pb-11 lg:px-8 lg:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="flex w-full flex-col gap-3 sm:max-w-lg sm:flex-row sm:items-stretch"
        >
          <Link
            href="/pcs"
            className="group relative inline-flex min-h-[3.25rem] flex-1 items-center justify-center gap-2 overflow-hidden rounded-lg bg-cyan px-6 text-[13px] font-extrabold tracking-[0.14em] text-background uppercase shadow-[0_0_22px_rgba(34,211,238,0.4)] transition duration-300 hover:-translate-y-0.5 hover:bg-cyan/90"
          >
            <span className="relative">Comprar una PC</span>
            <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            href="/upgrade"
            className="group relative inline-flex min-h-[3.25rem] flex-1 items-center justify-center gap-2 rounded-lg border border-gold/65 bg-background/55 px-5 text-[12px] font-extrabold tracking-[0.1em] text-gold uppercase backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10 sm:text-[13px]"
          >
            <span className="relative">Usa tu PC como pago</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
