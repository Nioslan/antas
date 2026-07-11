"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

type AdminLoginProps = {
  onSuccess: () => void;
};

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      onSuccess();
    } else {
      setError("Contraseña incorrecta");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-surface-elevated p-8"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full border border-cyan/20 bg-cyan/5 p-3">
            <Lock className="h-6 w-6 text-cyan" />
          </div>
          <h1 className="text-xl font-semibold">Panel ANTAS</h1>
          <p className="mt-1 text-sm text-muted">Ingresa tu contraseña de administrador</p>
        </div>

        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full rounded-xl border border-border bg-black px-4 py-3 text-sm outline-none transition-colors focus:border-cyan/50"
            required
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>

        <p className="text-center text-xs text-muted-dark">
          Contraseña por defecto: <span className="text-muted">antas2024</span>
        </p>
      </form>
    </div>
  );
}
