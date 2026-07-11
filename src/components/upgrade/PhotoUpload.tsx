"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PhotoUploadProps = {
  value: string;
  onChange: (url: string) => void;
  error?: string;
};

export function PhotoUpload({ value, onChange, error }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/trade-in/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setUploading(false);

    if (res.ok) {
      onChange(data.url);
    } else {
      setUploadError(data.error ?? "Error al subir la foto");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const displayError = error || uploadError;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300",
          dragOver
            ? "border-cyan bg-cyan/5"
            : value
              ? "border-border bg-black"
              : "border-border bg-surface hover:border-cyan/30 hover:bg-surface-elevated",
        )}
      >
        {value ? (
          <div className="relative aspect-[16/10] w-full sm:aspect-[21/9]">
            <Image
              src={value}
              alt="Foto de tu PC"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition-colors hover:bg-red-500/90"
            >
              <X className="h-3.5 w-3.5" />
              Cambiar foto
            </button>
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-cyan backdrop-blur-sm">
              <Camera className="h-3.5 w-3.5" />
              Foto cargada
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center gap-4 px-6 py-14 sm:py-20"
          >
            <div className="rounded-2xl border border-cyan/20 bg-cyan/5 p-5">
              <ImagePlus className="h-8 w-8 text-cyan" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-base font-medium">
                {uploading ? "Subiendo foto..." : "Foto de tu PC"}
              </p>
              <p className="max-w-xs text-sm text-muted">
                Sube una imagen clara de los componentes de tu PC.
              </p>
              <p className="text-xs text-muted-dark">
                JPG, PNG o WebP · Máximo 5 MB
              </p>
            </div>
          </button>
        )}
      </div>

      {displayError && (
        <p className="mt-2 text-sm text-red-400">{displayError}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
