"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type NavSearchProps = {
  className?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
};

export function NavSearch({ className, onSubmit, autoFocus }: NavSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/pcs?q=${encodeURIComponent(q)}` : "/pcs");
    onSubmit?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn("relative", className)}
    >
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar PCs…"
        autoFocus={autoFocus}
        aria-label="Buscar PCs"
        className="h-9 w-full rounded-full border border-border bg-white/[0.03] pr-3 pl-9 text-sm text-foreground outline-none transition placeholder:text-muted/70 focus:border-cyan/35 focus:bg-white/[0.05] focus:ring-1 focus:ring-cyan/20"
      />
    </form>
  );
}
