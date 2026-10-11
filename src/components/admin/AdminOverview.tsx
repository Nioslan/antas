"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  CalendarRange,
  TrendingUp,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { Order } from "@/types/orders";
import type { Product } from "@/types/inventory";

type AdminOverviewProps = {
  products: Product[];
};

type Period = "day" | "week" | "month" | "year";

const PERIOD_LABELS: Record<Period, string> = {
  day: "Por día",
  week: "Por semana",
  month: "Por mes",
  year: "Por año",
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // lunes = 0
  x.setDate(x.getDate() - day);
  return x;
}

function shortDay(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

type Bucket = { label: string; total: number; count: number };

function buildBuckets(orders: Order[], period: Period): Bucket[] {
  const paid = orders.filter((o) => o.status === "paid");
  const now = new Date();

  if (period === "day") {
    const days: Bucket[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = startOfDay(now);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const inDay = paid.filter((o) => {
        const t = new Date(o.soldAt).getTime();
        return t >= d.getTime() && t < next.getTime();
      });
      days.push({
        label: shortDay(d.toISOString()),
        total: inDay.reduce((s, o) => s + o.total, 0),
        count: inDay.length,
      });
    }
    return days;
  }

  if (period === "week") {
    const weeks: Bucket[] = [];
    const thisMonday = startOfWeek(now);
    for (let i = 7; i >= 0; i--) {
      const start = new Date(thisMonday);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const inWeek = paid.filter((o) => {
        const t = new Date(o.soldAt).getTime();
        return t >= start.getTime() && t < end.getTime();
      });
      weeks.push({
        label: shortDay(start.toISOString()),
        total: inWeek.reduce((s, o) => s + o.total, 0),
        count: inWeek.length,
      });
    }
    return weeks;
  }

  if (period === "month") {
    const months: Bucket[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const inMonth = paid.filter((o) => {
        const t = new Date(o.soldAt).getTime();
        return t >= d.getTime() && t < next.getTime();
      });
      months.push({
        label: new Intl.DateTimeFormat("es-MX", { month: "short" }).format(d),
        total: inMonth.reduce((s, o) => s + o.total, 0),
        count: inMonth.length,
      });
    }
    return months;
  }

  const byYear = new Map<number, Bucket>();
  for (const o of paid) {
    const y = new Date(o.soldAt).getFullYear();
    const b = byYear.get(y) ?? { label: String(y), total: 0, count: 0 };
    b.total += o.total;
    b.count += 1;
    byYear.set(y, b);
  }
  return [...byYear.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function AdminOverview({ products }: AdminOverviewProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setOrders(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  const paid = useMemo(() => orders.filter((o) => o.status === "paid"), [orders]);

  const kpis = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekStart = startOfWeek(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const sum = (list: Order[]) => ({
      total: list.reduce((s, o) => s + o.total, 0),
      count: list.length,
    });
    const inRange = (from: Date, to: Date) =>
      paid.filter((o) => {
        const t = new Date(o.soldAt).getTime();
        return t >= from.getTime() && t < to.getTime();
      });

    const inventoryUnits = products.reduce((s, p) => s + p.stock, 0);
    const inventoryValue = products.reduce((s, p) => s + p.price * p.stock, 0);

    return {
      inventoryUnits,
      inventoryValue,
      today: sum(inRange(today, tomorrow)),
      week: sum(inRange(weekStart, tomorrow)),
      month: sum(inRange(monthStart, tomorrow)),
      year: sum(inRange(yearStart, tomorrow)),
    };
  }, [paid, products]);

  const buckets = useMemo(() => buildBuckets(orders, period), [orders, period]);
  const maxBucket = Math.max(1, ...buckets.map((b) => b.total));

  const lowStock = useMemo(
    () =>
      products
        .filter((p) => p.stock <= 2)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 8),
    [products],
  );

  const recent = useMemo(
    () =>
      [...orders]
        .sort((a, b) => +new Date(b.soldAt) - +new Date(a.soldAt))
        .slice(0, 5),
    [orders],
  );

  const kpiCards = [
    {
      icon: Boxes,
      label: "Inventario",
      value: `${kpis.inventoryUnits} uds`,
      sub: `${formatPrice(kpis.inventoryValue)} en valor`,
      accent: "text-gold",
    },
    {
      icon: CalendarDays,
      label: "Vendido hoy",
      value: formatPrice(kpis.today.total),
      sub: `${kpis.today.count} venta${kpis.today.count === 1 ? "" : "s"}`,
      accent: "text-cyan",
    },
    {
      icon: CalendarRange,
      label: "Esta semana",
      value: formatPrice(kpis.week.total),
      sub: `${kpis.week.count} venta${kpis.week.count === 1 ? "" : "s"}`,
      accent: "text-cyan",
    },
    {
      icon: TrendingUp,
      label: "Este mes",
      value: formatPrice(kpis.month.total),
      sub: `${kpis.month.count} venta${kpis.month.count === 1 ? "" : "s"} · Año: ${formatPrice(kpis.year.total)}`,
      accent: "text-cyan",
    },
  ];

  return (
    <div className="space-y-6">
      {loading ? (
        <p className="text-sm text-muted">Cargando resumen...</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <div className="flex items-center gap-2 text-xs tracking-[0.14em] text-muted uppercase">
                  <kpi.icon className={cn("h-3.5 w-3.5", kpi.accent)} />
                  {kpi.label}
                </div>
                <p className={cn("mt-2 text-2xl font-semibold", kpi.accent)}>
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs text-muted">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-[0.14em] text-muted uppercase">
                Ventas por período
              </h2>
              <div className="flex gap-1">
                {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs transition-colors",
                      period === p
                        ? "bg-cyan text-black"
                        : "border border-border text-muted hover:text-foreground",
                    )}
                  >
                    {PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            {buckets.every((b) => b.total === 0) ? (
              <p className="py-8 text-center text-sm text-muted">
                Sin ventas registradas en este período.
              </p>
            ) : (
              <div>
                <div className="flex h-40 items-end gap-1.5 sm:gap-2">
                  {buckets.map((b, i) => (
                    <div
                      key={i}
                      className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
                      title={`${b.label}: ${formatPrice(b.total)} (${b.count} ventas)`}
                    >
                      <span className="text-[10px] font-medium text-muted opacity-0 transition-opacity group-hover:opacity-100">
                        {b.total > 0 ? formatPrice(b.total) : ""}
                      </span>
                      <div
                        className={cn(
                          "w-full rounded-t-md transition-all",
                          b.total > 0
                            ? "bg-cyan/70 group-hover:bg-cyan"
                            : "bg-white/5",
                        )}
                        style={{
                          height: `${Math.max(b.total > 0 ? 4 : 2, (b.total / maxBucket) * 100)}%`,
                        }}
                      />
                      <span className="max-w-full truncate text-[10px] text-muted">
                        {b.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted">
                  Total del período visible:{" "}
                  <span className="font-semibold text-foreground">
                    {formatPrice(buckets.reduce((s, b) => s + b.total, 0))}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-muted uppercase">
                <AlertTriangle className="h-4 w-4 text-gold" />
                Stock bajo
              </h2>
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted">
                  Todo el inventario tiene buen stock.
                </p>
              ) : (
                <ul className="space-y-2">
                  {lowStock.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate font-medium">
                        {p.name}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          p.stock === 0
                            ? "bg-red-500/15 text-red-400"
                            : "bg-gold/15 text-gold",
                        )}
                      >
                        {p.stock === 0 ? "Agotado" : `Quedan ${p.stock}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold tracking-[0.14em] text-muted uppercase">
                Últimas ventas
              </h2>
              {recent.length === 0 ? (
                <p className="text-sm text-muted">Aún no hay ventas.</p>
              ) : (
                <ul className="space-y-2">
                  {recent.map((o) => (
                    <li
                      key={o.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {o.customer.name}
                        </p>
                        <p className="text-xs text-muted">
                          {o.number} ·{" "}
                          {new Intl.DateTimeFormat("es-MX", {
                            day: "numeric",
                            month: "short",
                          }).format(new Date(o.soldAt))}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold text-cyan">
                        {formatPrice(o.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
