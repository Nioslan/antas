import type { DaySummary, Transaction } from '../types/finance';
import { monthKey, todayKey } from './categories';
import { summarizeDay } from './summary';

export type Period = 'day' | 'week' | 'month' | 'year';

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Semana siempre lunes → domingo (calendario local) */
export function getWeekRange(anchorIso = todayKey()): { start: string; end: string } {
  const date = parseIso(anchorIso);
  const day = date.getDay(); // 0=domingo … 6=sábado
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffToMonday);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { start: toIso(start), end: toIso(end) };
}

export function shiftWeek(anchorIso: string, weeks: number): string {
  const date = parseIso(anchorIso);
  date.setDate(date.getDate() + weeks * 7);
  return toIso(date);
}

export function daysInWeek(anchorIso = todayKey()): string[] {
  const { start } = getWeekRange(anchorIso);
  const startDate = parseIso(start);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return toIso(d);
  });
}

export function isDateInWeek(isoDate: string, weekAnchor = todayKey()): boolean {
  const { start, end } = getWeekRange(weekAnchor);
  return isoDate >= start && isoDate <= end;
}

export function isInYear(isoDate: string, year = new Date().getFullYear()): boolean {
  return isoDate.startsWith(String(year));
}

const WEEKDAY_SHORT_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] as const;

export function weekdayShort(iso: string): string {
  return WEEKDAY_SHORT_ES[parseIso(iso).getDay()];
}

export function formatWeekLabel(anchorIso = todayKey()): string {
  const { start, end } = getWeekRange(anchorIso);
  const a = parseIso(start);
  const b = parseIso(end);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `Lun ${a.toLocaleDateString('es-ES', opts)} – Dom ${b.toLocaleDateString('es-ES', opts)}`;
}

export function dayNumber(iso: string): string {
  return String(parseIso(iso).getDate());
}

export function periodTitle(period: Period): string {
  if (period === 'day') return 'Día';
  if (period === 'week') return 'Semana';
  if (period === 'month') return 'Mes';
  return 'Año';
}

export function summarizeInRange(
  transactions: Transaction[],
  start: string,
  end: string
): DaySummary {
  let inversion = 0;
  let gasto = 0;
  let giro = 0;
  let recuperado = 0;
  let ganancia = 0;

  for (const t of transactions) {
    if (t.date < start || t.date > end) continue;
    if (t.type === 'inversion') inversion += t.amount;
    else if (t.type === 'gasto') gasto += t.amount;
    else {
      giro += t.amount;
      const rec = Math.min(Math.max(t.recovered ?? t.amount, 0), t.amount);
      recuperado += rec;
      ganancia += Math.max(t.amount - rec, 0);
    }
  }

  return {
    inversion,
    gasto,
    giro,
    recuperado,
    ganancia,
    libre: giro - gasto - inversion,
  };
}

export function summarizePeriod(
  transactions: Transaction[],
  period: Period,
  anchorIso = todayKey()
): DaySummary {
  if (period === 'day') {
    return summarizeDay(transactions, anchorIso);
  }
  if (period === 'week') {
    const { start, end } = getWeekRange(anchorIso);
    return summarizeInRange(transactions, start, end);
  }
  if (period === 'month') {
    const key = monthKey(anchorIso);
    const start = `${key}-01`;
    const endDate = parseIso(start);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);
    return summarizeInRange(transactions, start, toIso(endDate));
  }
  const year = parseIso(anchorIso).getFullYear();
  return summarizeInRange(transactions, `${year}-01-01`, `${year}-12-31`);
}

export function filterByPeriod(
  transactions: Transaction[],
  period: Period,
  anchorIso = todayKey()
): Transaction[] {
  if (period === 'day') {
    return transactions.filter((t) => t.date === anchorIso);
  }
  if (period === 'week') {
    const { start, end } = getWeekRange(anchorIso);
    return transactions.filter((t) => t.date >= start && t.date <= end);
  }
  if (period === 'month') {
    const key = monthKey(anchorIso);
    return transactions.filter((t) => t.date.startsWith(key));
  }
  const year = String(parseIso(anchorIso).getFullYear());
  return transactions.filter((t) => t.date.startsWith(year));
}

export function shiftPeriod(period: Period, anchorIso: string, delta: number): string {
  const date = parseIso(anchorIso);
  if (period === 'day') {
    date.setDate(date.getDate() + delta);
  } else if (period === 'week') {
    date.setDate(date.getDate() + delta * 7);
  } else if (period === 'month') {
    date.setMonth(date.getMonth() + delta);
  } else {
    date.setFullYear(date.getFullYear() + delta);
  }
  return toIso(date);
}

export function formatPeriodLabel(period: Period, anchorIso: string): string {
  const date = parseIso(anchorIso);
  if (period === 'day') {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }
  if (period === 'week') return formatWeekLabel(anchorIso);
  if (period === 'month') {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }
  return String(date.getFullYear());
}
