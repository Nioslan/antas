import { Platform, Vibration } from 'react-native';
import type { FixedExpense } from '../types/fixed';
import { todayKey } from './categories';
import { daysUntil, dueDateInMonth } from './fixedExpenses';

/** Patrón fuerte: vibra – pausa – vibra – pausa – vibra larga */
export const VIBRATE_PATTERN = [0, 400, 200, 400, 200, 700];

function isStillUnpaid(bill: FixedExpense, dueIso: string): boolean {
  if (!bill.lastPaidDate) return true;
  return bill.lastPaidDate < dueIso;
}

function nextDueFrom(dueDay: number, fromIso: string): string {
  const [y, m, d] = fromIso.split('-').map(Number);
  const thisMonth = dueDateInMonth(dueDay, y, m - 1);
  const dueDayNum = Number(thisMonth.slice(8, 10));
  if (d <= dueDayNum) return thisMonth;
  const nextMonth = new Date(y, m, 1);
  return dueDateInMonth(
    dueDay,
    nextMonth.getFullYear(),
    nextMonth.getMonth()
  );
}

/** Lista de fijos pendientes en la ventana de avisos. */
export function listDueSoonBills(
  fixed: FixedExpense[],
  fromIso = todayKey(),
  windowDays = 5
): Array<{ bill: FixedExpense; due: string; days: number }> {
  return fixed
    .filter((bill) => bill.enabled)
    .map((bill) => {
      const due = nextDueFrom(bill.dueDay, fromIso);
      const days = daysUntil(due, fromIso);
      return { bill, due, days };
    })
    .filter(({ bill, due, days }) => {
      if (days < 0 || days > windowDays) return false;
      return isStillUnpaid(bill, due);
    })
    .sort((a, b) => a.days - b.days);
}

/** Cuenta fijos pendientes en los próximos 5 días (badge). */
export function countUpcomingBills(
  fixed: FixedExpense[],
  fromIso = todayKey()
): number {
  return listDueSoonBills(fixed, fromIso, 5).length;
}

/** Vibra el teléfono (sin expo-notifications). */
export function vibrateForBillAlert(): void {
  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate(VIBRATE_PATTERN);
    } else {
      Vibration.vibrate([400, 200, 400]);
    }
  } catch {
    // sin vibrador
  }
}
