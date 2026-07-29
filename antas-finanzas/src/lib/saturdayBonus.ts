import type { FinanceState } from '../types/finance';
import { todayKey } from './categories';
import { getWeekRange, summarizePeriod, toIso } from './periods';

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Porcentaje del bono (0–100). */
export function clampBonusPercent(value: number): number {
  if (!Number.isFinite(value)) return 20;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function rateFromPercent(percent: number): number {
  return clampBonusPercent(percent) / 100;
}

/** Sábado de la semana del ancla (lun–dom). */
export function saturdayOfWeek(anchorIso = todayKey()): string {
  const { start } = getWeekRange(anchorIso);
  const monday = parseIso(start);
  const saturday = new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + 5
  );
  return toIso(saturday);
}

/**
 * Si ya pasó (o es) el sábado de la semana actual y aún no se aplicó el bono,
 * suma el % configurado de la ganancia libre de esa semana a cashNow.
 */
export function applySaturdayBonusIfDue(
  state: FinanceState,
  percent = 20
): {
  state: FinanceState;
  applied: boolean;
  bonus: number;
  weekLibre: number;
  weekStart: string;
} {
  const today = todayKey();
  const { start: weekStart } = getWeekRange(today);
  const saturday = saturdayOfWeek(today);
  const rate = rateFromPercent(percent);

  // Solo aplica desde el sábado en adelante (sáb o dom de esa semana)
  if (today < saturday) {
    return { state, applied: false, bonus: 0, weekLibre: 0, weekStart };
  }

  if (state.lastSaturdayBonusWeek === weekStart) {
    return { state, applied: false, bonus: 0, weekLibre: 0, weekStart };
  }

  const weekLibre = summarizePeriod(state.transactions, 'week', today).libre;
  const bonus =
    weekLibre > 0 && rate > 0
      ? Math.round(weekLibre * rate * 100) / 100
      : 0;

  return {
    state: {
      ...state,
      cashNow: Math.round((state.cashNow + bonus) * 100) / 100,
      lastSaturdayBonusWeek: weekStart,
    },
    applied: true,
    bonus,
    weekLibre,
    weekStart,
  };
}

/** Vista previa del bono de la semana actual (aunque aún no sea sábado). */
export function previewSaturdayBonus(
  state: FinanceState,
  percent = 20
): {
  weekLibre: number;
  bonus: number;
  saturday: string;
  alreadyApplied: boolean;
  percent: number;
} {
  const today = todayKey();
  const { start: weekStart } = getWeekRange(today);
  const saturday = saturdayOfWeek(today);
  const pct = clampBonusPercent(percent);
  const rate = rateFromPercent(pct);
  const weekLibre = summarizePeriod(state.transactions, 'week', today).libre;
  const bonus =
    weekLibre > 0 && rate > 0
      ? Math.round(weekLibre * rate * 100) / 100
      : 0;

  return {
    weekLibre,
    bonus,
    saturday,
    alreadyApplied: state.lastSaturdayBonusWeek === weekStart,
    percent: pct,
  };
}
