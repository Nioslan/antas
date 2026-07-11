"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  name: string;
  cover: string;
  images?: string[];
  video?: string;
};

export function ProductGallery({
  name,
  cover,
  images = [],
  video,
}: ProductGalleryProps) {
  const gallery = [cover, ...images.filter((url) => url && url !== cover)].filter(
    Boolean,
  );
  const [active, setActive] = useState(0);
  const current = gallery[active] ?? cover;

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-black">
        {current ? (
          <Image
            src={current}
            alt={name}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            Sin imagen
          </div>
        )}
      </div>

      {gallery.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {gallery.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border bg-black transition",
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
                unoptimized
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

      {video ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-black">
          <video
            src={video}
            className="aspect-video w-full object-contain"
            controls
            playsInline
            preload="metadata"
            poster={cover || undefined}
          >
            Tu navegador no soporta video.
          </video>
        </div>
      ) : null}
    </div>
  );
}
