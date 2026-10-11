"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_GALLERY = 12;

type GalleryUploadProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  max?: number;
  className?: string;
};

export function GalleryUpload({
  value,
  onChange,
  label = "Galería de fotos",
  max = MAX_GALLERY,
  className,
}: GalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const remaining = max - value.length;

  async function uploadOne(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al subir");
      return null;
    }
    return data.url as string;
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, remaining);
    if (!list.length) return;
    setUploading(list.length);
    setError("");
    setDragging(false);
    // Subida en paralelo para que sea rápido
    const results = await Promise.all(list.map(uploadOne));
    const uploaded = results.filter(Boolean) as string[];
    if (uploaded.length) {
      onChange([...value, ...uploaded].slice(0, max));
    }
    setUploading(0);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...value];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className={className}>
      <p className="mb-1 text-sm font-medium">{label}</p>
      <p className="mb-2 text-xs text-muted">
        Hasta {max} fotos · {value.length}/{max} · Sube fotos del estilo (RGB,
        armado, ángulos) y del rendimiento (benchmarks, FPS, temperaturas).
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-2xl border border-dashed p-3 transition-colors",
          dragging
            ? "border-cyan/60 bg-cyan/5"
            : "border-border/60 bg-black/20",
        )}
      >
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-black"
            >
              <Image
                src={url}
                alt={`Foto ${index + 1}`}
                fill
                className="object-cover"
              />
              <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                {index + 1}
              </span>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded-full bg-black/70 p-1 text-white transition hover:bg-white/20 disabled:opacity-30"
                  aria-label="Mover antes"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  className="rounded-full bg-black/70 p-1 text-white transition hover:bg-white/20 disabled:opacity-30"
                  aria-label="Mover después"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="rounded-full bg-black/70 p-1 text-white transition hover:bg-red-500/80"
                  aria-label="Eliminar foto"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}

          {remaining > 0 ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading > 0}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted transition hover:border-cyan/40 hover:bg-white/[0.03] hover:text-foreground",
              )}
            >
              <Upload
                className={cn("h-5 w-5", uploading > 0 && "animate-pulse")}
              />
              <span className="px-1 text-center text-[10px] leading-tight">
                {uploading > 0
                  ? `Subiendo ${uploading}...`
                  : "Agregar o arrastrar fotos"}
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
