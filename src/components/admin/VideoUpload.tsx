"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Film, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_VIDEOS = 3;

type VideoUploadProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  max?: number;
  className?: string;
};

export function VideoUpload({
  value,
  onChange,
  label = "Videos del producto",
  max = MAX_VIDEOS,
  className,
}: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");

  const remaining = max - value.length;

  async function uploadOne(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al subir video");
      return null;
    }
    return data.url as string;
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, remaining);
    if (!list.length) return;
    setUploading(list.length);
    setError("");
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
        Hasta {max} videos · {value.length}/{max} · MP4, WebM o MOV (máx. 80 MB
        c/u). Muestra el rendimiento (juegos, benchmarks) y el estilo (RGB,
        armado).
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {value.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black"
          >
            <video
              src={url}
              className="h-full w-full object-cover"
              playsInline
              preload="metadata"
              muted
            />
            <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-cyan">
              Video {index + 1}
            </span>
            <div className="absolute top-1.5 right-1.5 flex gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="rounded-full bg-black/70 p-1 text-white transition hover:bg-white/20 disabled:opacity-30"
                aria-label="Mover antes"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === value.length - 1}
                className="rounded-full bg-black/70 p-1 text-white transition hover:bg-white/20 disabled:opacity-30"
                aria-label="Mover después"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="rounded-full bg-black/70 p-1 text-white transition hover:bg-red-500/80"
                aria-label="Eliminar video"
              >
                <X className="h-3.5 w-3.5" />
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
              "flex aspect-video flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted transition hover:border-cyan/40 hover:bg-white/[0.03] hover:text-foreground",
            )}
          >
            {uploading > 0 ? (
              <Upload className="h-6 w-6 animate-pulse" />
            ) : (
              <Film className="h-6 w-6" />
            )}
            <span className="text-xs">
              {uploading > 0
                ? `Subiendo ${uploading}...`
                : "Subir videos"}
            </span>
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
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
