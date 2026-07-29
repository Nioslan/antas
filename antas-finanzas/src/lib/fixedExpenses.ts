import type { Transaction } from '../types/finance';
import type { FixedExpense } from '../types/fixed';
import { todayKey } from './categories';

function clampDay(day: number, year: number, monthIndex: number): number {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(Math.max(1, Math.round(day)), last);
}

export function dueDateInMonth(
  dueDay: number,
  year: number,
  monthIndex: number
): string {
  const day = clampDay(dueDay, year, monthIndex);
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function nextDueDate(dueDay: number, fromIso = todayKey()): string {
  const [y, m, d] = fromIso.split('-').map(Number);
  const thisMonth = dueDateInMonth(dueDay, y, m - 1);
  const dueDayThis = Number(thisMonth.slice(8, 10));
  if (d <= dueDayThis) return thisMonth;
  const next = new Date(y, m, 1); // month m is already next in 1-based... wait
  // m is 1-based month. Date(y, m, 1) = first of next month since monthIndex would be m
  const nextMonth = new Date(y, m, 1); // JS: month index m means month m+1... Date(2026, 7, 1) = Aug 1 if m=7 for July
  // fromIso July: y=2026, m=7, d=20. thisMonth due. next = Date(2026, 7, 1) = August 1. getMonth()=7 = August. Good.
  return dueDateInMonth(
    dueDay,
    nextMonth.getFullYear(),
    nextMonth.getMonth()
  );
}

export function daysUntil(isoDate: string, fromIso = todayKey()): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = isoDate.split('-').map(Number);
  const a = new Date(y1, m1 - 1, d1).getTime();
  const b = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function reminderDate(dueIso: string, daysBefore = 5): string {
  const [y, m, d] = dueIso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - daysBefore);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 1;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Detecta si un gasto parece un pago fijo y actualiza aprendizaje. */
export function learnFromTransaction(
  fixed: FixedExpense[],
  tx: Transaction
): FixedExpense[] {
  if (tx.type !== 'gasto') return fixed;
  const note = normalize(tx.note);
  const day = Number(tx.date.slice(8, 10));
  if (!day) return fixed;

  return fixed.map((f) => {
    const name = normalize(f.name);
    const nameInNote =
      note.length > 0 &&
      (note.includes(name) ||
        name.includes(note) ||
        (name.length >= 4 && note.includes(name.slice(0, 4))));
    const amountClose =
      f.amount > 0 && Math.abs(tx.amount - f.amount) / f.amount <= 0.25;
    const categoryMatch = f.category === tx.category;
    const match = nameInNote || (categoryMatch && amountClose);

    if (!match) return f;

    const learnedDays = [...f.learnedDays, day].slice(-8);
    const learnedDue = median(learnedDays);
    const amount =
      f.amount > 0
        ? Math.round((f.amount * 0.7 + tx.amount * 0.3) * 100) / 100
        : tx.amount;

    return {
      ...f,
      learnedDays,
      dueDay: learnedDue,
      amount,
      lastPaidDate: tx.date,
      updatedAt: new Date().toISOString(),
    };
  });
}

export function daysSince(isoDate: string, fromIso = todayKey()): number {
  return -daysUntil(isoDate, fromIso);
}

/** Tras pagar, el botón queda en "Pagado" durante 5 días. */
export function isPayButtonLocked(
  lastPaidDate?: string,
  cooldownDays = 5,
  fromIso = todayKey()
): boolean {
  if (!lastPaidDate) return false;
  const elapsed = daysSince(lastPaidDate, fromIso);
  return elapsed >= 0 && elapsed < cooldownDays;
}

export function daysUntilPayUnlock(
  lastPaidDate?: string,
  cooldownDays = 5,
  fromIso = todayKey()
): number {
  if (!lastPaidDate) return 0;
  const elapsed = daysSince(lastPaidDate, fromIso);
  if (elapsed < 0) return 0;
  return Math.max(0, cooldownDays - elapsed);
}

export function upcomingFixed(fixed: FixedExpense[], withinDays = 14) {
  return fixed
    .filter((f) => f.enabled)
    .map((f) => {
      const due = nextDueDate(f.dueDay);
      const days = daysUntil(due);
      return {
        ...f,
        due,
        days,
        remindOn: reminderDate(due, 5),
      };
    })
    .filter((f) => f.days >= 0 && f.days <= withinDays)
    .sort((a, b) => a.days - b.days);
}
