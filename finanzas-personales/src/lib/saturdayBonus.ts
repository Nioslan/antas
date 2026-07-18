import type { FinanceState } from '../types/finance';
import { todayKey } from './categories';
import { getWeekRange, summarizePeriod, toIso } from './periods';

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
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
 * suma el 20% de la ganancia libre de esa semana a cashNow.
 */
export function applySaturdayBonusIfDue(state: FinanceState): {
  state: FinanceState;
  applied: boolean;
  bonus: number;
  weekLibre: number;
  weekStart: string;
} {
  const today = todayKey();
  const { start: weekStart } = getWeekRange(today);
  const saturday = saturdayOfWeek(today);

  // Solo aplica desde el sábado en adelante (sáb o dom de esa semana)
  if (today < saturday) {
    return { state, applied: false, bonus: 0, weekLibre: 0, weekStart };
  }

  if (state.lastSaturdayBonusWeek === weekStart) {
    return { state, applied: false, bonus: 0, weekLibre: 0, weekStart };
  }

  const weekLibre = summarizePeriod(state.transactions, 'week', today).libre;
  const bonus =
    weekLibre > 0 ? Math.round(weekLibre * 0.2 * 100) / 100 : 0;

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
export function previewSaturdayBonus(state: FinanceState): {
  weekLibre: number;
  bonus: number;
  saturday: string;
  alreadyApplied: boolean;
} {
  const today = todayKey();
  const { start: weekStart } = getWeekRange(today);
  const saturday = saturdayOfWeek(today);
  const weekLibre = summarizePeriod(state.transactions, 'week', today).libre;
  const bonus =
    weekLibre > 0 ? Math.round(weekLibre * 0.2 * 100) / 100 : 0;

  return {
    weekLibre,
    bonus,
    saturday,
    alreadyApplied: state.lastSaturdayBonusWeek === weekStart,
  };
}
