import type { FinanceState } from '../types/finance';
import { formatMoney, todayKey } from './categories';

export type MoneyEventKind = 'fixed' | 'debt' | 'income_hint';

export interface MoneyCalendarEvent {
  id: string;
  date: string;
  title: string;
  amount: number;
  kind: MoneyEventKind;
  subtitle?: string;
}

function isoForDayInMonth(year: number, month: number, day: number): string {
  const dim = new Date(year, month, 0).getDate();
  const d = Math.min(Math.max(1, day), dim);
  return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function buildMonthMoneyEvents(
  state: FinanceState,
  monthAnchor = todayKey()
): MoneyCalendarEvent[] {
  const [y, m] = monthAnchor.split('-').map(Number);
  const monthKey = monthAnchor.slice(0, 7);
  const events: MoneyCalendarEvent[] = [];

  for (const f of state.fixedExpenses ?? []) {
    if (!f.enabled) continue;
    const date = isoForDayInMonth(y, m, f.dueDay);
    const paid = f.lastPaidDate?.startsWith(monthKey);
    events.push({
      id: `fixed:${f.id}:${monthKey}`,
      date,
      title: f.name,
      amount: f.amount,
      kind: 'fixed',
      subtitle: paid ? 'Pagado' : 'Pendiente',
    });
  }

  for (const d of state.debts ?? []) {
    if (!d.dueDay || d.remaining <= 0) continue;
    const date = isoForDayInMonth(y, m, d.dueDay);
    events.push({
      id: `debt:${d.id}:${monthKey}`,
      date,
      title: d.name,
      amount: d.installmentAmount ?? d.remaining,
      kind: 'debt',
      subtitle: d.kind === 'i_owe' ? 'A pagar' : 'A cobrar',
    });
  }

  // Ingresos del mes ya cargados (pista en calendario)
  for (const t of state.transactions) {
    if (t.type !== 'giro') continue;
    if (!t.date.startsWith(monthKey)) continue;
    events.push({
      id: `income:${t.id}`,
      date: t.date,
      title: t.note?.trim() || 'Ingreso',
      amount: t.amount,
      kind: 'income_hint',
      subtitle: 'Cargado',
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export function eventsForDay(
  events: MoneyCalendarEvent[],
  iso: string
): MoneyCalendarEvent[] {
  return events.filter((e) => e.date === iso);
}

export function formatEventLine(e: MoneyCalendarEvent): string {
  const sign = e.kind === 'income_hint' ? '+' : '-';
  return `${e.title}: ${sign}${formatMoney(e.amount)}${e.subtitle ? ` · ${e.subtitle}` : ''}`;
}
