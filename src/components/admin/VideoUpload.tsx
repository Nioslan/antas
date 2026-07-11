"use client";

import { useRef, useState } from "react";
import { Film, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type VideoUploadProps = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
};

export function VideoUpload({
  value,
  onChange,
  label = "Video del producto",
  className,
}: VideoUploadProps) {
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
      <p className="mb-2 text-xs text-muted">
        Opcional. MP4, WebM o MOV · máx. 80 MB
      </p>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-black aspect-video",
        )}
      >
        {value ? (
          <>
            <video
              src={value}
              className="h-full w-full object-cover"
              controls
              playsInline
              preload="metadata"
            />
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
            {uploading ? (
              <Upload className="h-6 w-6 animate-pulse" />
            ) : (
              <Film className="h-6 w-6" />
            )}
            <span className="text-xs">
              {uploading ? "Subiendo video..." : "Subir video"}
            </span>
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
