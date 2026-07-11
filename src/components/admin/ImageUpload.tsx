"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageUploadProps = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  aspect?: "square" | "wide" | "logo";
};

const aspectClasses = {
  square: "aspect-square",
  wide: "aspect-video",
  logo: "aspect-[3/1]",
};

export function ImageUpload({
  value,
  onChange,
  label = "Imagen",
  className,
  aspect = "square",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    setUploading(false);

    if (res.ok) {
      onChange(data.url);
    } else {
      setError(data.error ?? "Error al subir");
    }
  }

  return (
    <div className={className}>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-black",
          aspectClasses[aspect],
        )}
      >
        {value ? (
          <>
            <Image src={value} alt={label} fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white transition-colors hover:bg-red-500/80"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <Upload className="h-6 w-6" />
            <span className="text-xs">{uploading ? "Subiendo..." : "Subir imagen"}</span>
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
