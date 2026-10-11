"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  name: string;
  cover: string;
  images?: string[];
  video?: string;
  videos?: string[];
};

export function ProductGallery({
  name,
  cover,
  images = [],
  video,
  videos = [],
}: ProductGalleryProps) {
  const gallery = [cover, ...images.filter((url) => url && url !== cover)].filter(
    Boolean,
  );
  const allVideos = [video, ...videos].filter(Boolean) as string[];

  const [active, setActive] = useState(0);
  const [activeVideo, setActiveVideo] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const current = gallery[active] ?? cover;

  const step = useCallback(
    (dir: 1 | -1) => {
      setActive((prev) => (prev + dir + gallery.length) % gallery.length);
    },
    [gallery.length],
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, step]);

  return (
    <div className="space-y-4">
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-border bg-black"
        onClick={() => current && setLightbox(true)}
      >
        {current ? (
          <Image
            src={current}
            alt={name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            Sin imagen
          </div>
        )}
        {gallery.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Foto anterior"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Foto siguiente"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white">
              <Expand className="h-3 w-3" />
              {active + 1}/{gallery.length}
            </span>
          </>
        ) : null}
      </div>

      {gallery.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gallery.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative aspect-square w-16 shrink-0 overflow-hidden rounded-xl border bg-black transition sm:w-20",
                active === index
                  ? "border-cyan ring-1 ring-cyan/40"
                  : "border-border hover:border-cyan/30",
              )}
            >
              <Image
                src={url}
                alt={`${name} ${index + 1}`}
                fill
                className="object-cover"
              />
              {index === 0 ? (
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-cyan uppercase">
                  Portada
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {allVideos.length > 0 ? (
        <div className="space-y-3">
          {allVideos.length > 1 ? (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {allVideos.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveVideo(index)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition",
                    activeVideo === index
                      ? "bg-cyan text-black"
                      : "border border-border text-muted hover:text-foreground",
                  )}
                >
                  <Play className="h-3 w-3" />
                  Video {index + 1}
                </button>
              ))}
            </div>
          ) : null}
          <div className="overflow-hidden rounded-2xl border border-border bg-black">
            <video
              key={allVideos[activeVideo]}
              src={allVideos[activeVideo]}
              className="aspect-video w-full object-contain"
              controls
              playsInline
              preload="metadata"
              poster={cover || undefined}
            >
              Tu navegador no soporta video.
            </video>
          </div>
        </div>
      ) : null}

      {lightbox && current ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
            onClick={() => setLightbox(false)}
          >
            <X className="h-5 w-5" />
          </button>
          {gallery.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Foto anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute left-2 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20 sm:left-6"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Foto siguiente"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute right-2 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20 sm:right-6"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          ) : null}
          <div
            className="relative max-h-[85vh] w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current}
              alt={name}
              width={1600}
              height={1600}
              className="max-h-[85vh] w-full rounded-xl object-contain"
            />
            <p className="mt-3 text-center text-sm text-white/70">
              {active + 1} de {gallery.length}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
