"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, formatPrice } from "@/lib/utils";
import {
  FINANCE_TYPE_LABELS,
  type FinanceEntry,
  type FinanceEntryType,
  type FinanceSummary,
} from "@/types/finance";

const emptySummary: FinanceSummary = {
  invested: 0,
  expenses: 0,
  extraIncome: 0,
  sold: 0,
  salesCount: 0,
  profit: 0,
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function AdminFinance() {
  const [summary, setSummary] = useState<FinanceSummary>(emptySummary);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [type, setType] = useState<FinanceEntryType>("investment");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/finance");
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary ?? emptySummary);
        setEntries(data.entries ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetForm() {
    setType("investment");
    setLabel("");
    setAmount("");
    setNote("");
    setDate(new Date().toISOString().slice(0, 10));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        label,
        amount: Number(amount),
        note: note || undefined,
        date: date ? new Date(`${date}T12:00:00`).toISOString() : undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No se pudo guardar.");
      setSaving(false);
      return;
    }

    setSummary(data.summary ?? emptySummary);
    setEntries(data.entries ?? []);
    resetForm();
    setShowForm(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este movimiento?")) return;
    const res = await fetch(`/api/finance?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (res.ok) {
      setSummary(data.summary ?? emptySummary);
      setEntries(data.entries ?? []);
    } else {
      alert(data.error || "No se pudo eliminar.");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-black px-4 py-2.5 text-sm outline-none transition-colors focus:border-cyan/50";

  const totalOut = summary.invested + summary.expenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {!showForm && (
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo movimiento
          </Button>
        )}
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted transition hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Actualizar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-xs tracking-[0.16em] text-muted uppercase">
            <TrendingDown className="h-3.5 w-3.5 text-gold" />
            Invertido / costos
          </div>
          <p className="mt-2 text-2xl font-semibold text-gold">
            {formatPrice(totalOut)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Inversión {formatPrice(summary.invested)} · Gastos{" "}
            {formatPrice(summary.expenses)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-xs tracking-[0.16em] text-muted uppercase">
            <Wallet className="h-3.5 w-3.5 text-cyan" />
            Vendido
          </div>
          <p className="mt-2 text-2xl font-semibold text-cyan">
            {formatPrice(summary.sold)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {summary.salesCount} venta{summary.salesCount === 1 ? "" : "s"}{" "}
            pagada{summary.salesCount === 1 ? "" : "s"}
            {summary.extraIncome > 0
              ? ` · Extra ${formatPrice(summary.extraIncome)}`
              : ""}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 text-xs tracking-[0.16em] text-muted uppercase">
            <TrendingUp
              className={cn(
                "h-3.5 w-3.5",
                summary.profit >= 0 ? "text-cyan" : "text-red-400",
              )}
            />
            Ganancia
          </div>
          <p
            className={cn(
              "mt-2 text-2xl font-semibold",
              summary.profit >= 0 ? "text-cyan" : "text-red-400",
            )}
          >
            {formatPrice(summary.profit)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Vendido + extras − inversión − gastos
          </p>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-surface p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Registrar movimiento</h2>
              <p className="mt-1 text-xs text-muted">
                Las ventas se calculan solas desde Ventas. Aquí registras lo que
                inviertes o gastas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="text-xs text-muted hover:text-foreground"
            >
              Cancelar
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs text-muted">Tipo</span>
              <select
                className={inputClass}
                value={type}
                onChange={(e) => setType(e.target.value as FinanceEntryType)}
              >
                {(Object.keys(FINANCE_TYPE_LABELS) as FinanceEntryType[]).map(
                  (key) => (
                    <option key={key} value={key}>
                      {FINANCE_TYPE_LABELS[key]}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">Descripción *</span>
              <input
                required
                className={inputClass}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ej. Compra GPU RTX 4070"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">Monto (USD) *</span>
              <input
                required
                type="number"
                min={0.01}
                step="0.01"
                className={inputClass}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">Fecha</span>
              <input
                type="date"
                className={inputClass}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted">Nota</span>
              <input
                className={inputClass}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Opcional"
              />
            </label>
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar movimiento"}
          </Button>
        </form>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-[0.16em] text-muted uppercase">
          Movimientos ({entries.length})
        </h2>

        {loading ? (
          <p className="text-sm text-muted">Cargando finanzas...</p>
        ) : entries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            Aún no hay inversiones ni gastos. Registra lo que te cuesta armar o
            comprar equipos para ver la ganancia real.
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{entry.label}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                        entry.type === "income"
                          ? "bg-cyan/15 text-cyan"
                          : entry.type === "investment"
                            ? "bg-gold/15 text-gold"
                            : "bg-white/5 text-muted",
                      )}
                    >
                      {FINANCE_TYPE_LABELS[entry.type]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(entry.date)}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      entry.type === "income" ? "text-cyan" : "text-gold",
                    )}
                  >
                    {entry.type === "income" ? "+" : "-"}
                    {formatPrice(entry.amount)}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleDelete(entry.id)}
                    className="rounded-full border border-red-500/30 p-2 text-red-400 transition hover:bg-red-500/10"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
