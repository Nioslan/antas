"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_GALLERY = 5;

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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const remaining = max - value.length;

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, remaining);
    if (!list.length) return;

    setUploading(true);
    setError("");

    const uploaded: string[] = [];
    for (const file of list) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al subir");
        break;
      }
      uploaded.push(data.url as string);
    }

    if (uploaded.length) {
      onChange([...value, ...uploaded].slice(0, max));
    }
    setUploading(false);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className={className}>
      <p className="mb-1 text-sm font-medium">{label}</p>
      <p className="mb-2 text-xs text-muted">
        Hasta {max} fotos extra · {value.length}/{max}
      </p>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {value.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="relative aspect-square overflow-hidden rounded-xl border border-border bg-black"
          >
            <Image
              src={url}
              alt={`Foto ${index + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white transition hover:bg-red-500/80"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {remaining > 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted transition hover:border-cyan/40 hover:bg-white/[0.03] hover:text-foreground",
            )}
          >
            <Upload className="h-5 w-5" />
            <span className="px-1 text-center text-[10px] leading-tight">
              {uploading ? "Subiendo..." : "Agregar"}
            </span>
          </button>
        ) : null}
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
