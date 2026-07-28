import type { FinanceState, Transaction } from '../types/finance';
import { todayKey } from './categories';
import { filterByPeriod, summarizePeriod } from './periods';

export interface MonthProjection {
  daysElapsed: number;
  daysInMonth: number;
  daysLeft: number;
  spentSoFar: number;
  incomeSoFar: number;
  dailyBurn: number;
  projectedSpend: number;
  projectedIncome: number;
  remainingFixed: number;
  projectedLibre: number;
  paceLabel: string;
  tip: string;
}

function monthBounds(anchor = todayKey()): {
  start: string;
  end: string;
  daysInMonth: number;
  dayOfMonth: number;
} {
  const [y, m] = anchor.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const dayOfMonth = Math.min(Number(anchor.slice(8, 10)), daysInMonth);
  const start = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-01`;
  const end = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  return { start, end, daysInMonth, dayOfMonth };
}

function unpaidFixedThisMonth(state: FinanceState, today: string): number {
  const day = Number(today.slice(8, 10));
  const month = today.slice(0, 7);
  let sum = 0;
  for (const f of state.fixedExpenses ?? []) {
    if (!f.enabled) continue;
    if (f.dueDay < day) continue; // ya pasó el vencimiento este mes (aprox)
    if (f.lastPaidDate?.startsWith(month)) continue;
    sum += f.amount;
  }
  return sum;
}

export function projectMonthEnd(state: FinanceState, anchor = todayKey()): MonthProjection {
  const { daysInMonth, dayOfMonth } = monthBounds(anchor);
  const daysElapsed = Math.max(1, dayOfMonth);
  const daysLeft = Math.max(0, daysInMonth - dayOfMonth);
  const month = summarizePeriod(state.transactions, 'month', anchor);
  const dailyBurn = month.gasto / daysElapsed;
  const dailyIncome = month.giro / daysElapsed;
  const remainingFixed = unpaidFixedThisMonth(state, anchor);
  const projectedSpend =
    Math.round((month.gasto + dailyBurn * daysLeft + remainingFixed) * 100) / 100;
  const projectedIncome =
    Math.round((month.giro + dailyIncome * daysLeft) * 100) / 100;
  const projectedLibre =
    Math.round((projectedIncome - projectedSpend - month.inversion) * 100) / 100;

  let paceLabel = 'Sin datos todavía';
  let tip = 'Cargá ingresos y gastos para proyectar el cierre del mes.';
  if (month.giro > 0 || month.gasto > 0) {
    if (projectedLibre >= 0) {
      paceLabel = 'Vas bien encaminado';
      tip =
        daysLeft === 0
          ? 'Cerraste el mes en positivo según lo cargado.'
          : `Si seguís este ritmo, a fin de mes te quedarían ~$${projectedLibre.toFixed(0)}.`;
    } else {
      paceLabel = 'Ritmo alto de gastos';
      tip = `Si seguís así, el mes cierra ~$${Math.abs(projectedLibre).toFixed(0)} en rojo. Frená un poco esta semana.`;
    }
  }

  return {
    daysElapsed,
    daysInMonth,
    daysLeft,
    spentSoFar: month.gasto,
    incomeSoFar: month.giro,
    dailyBurn: Math.round(dailyBurn * 100) / 100,
    projectedSpend,
    projectedIncome,
    remainingFixed: Math.round(remainingFixed * 100) / 100,
    projectedLibre,
    paceLabel,
    tip,
  };
}

export function envelopeSpent(
  transactions: Transaction[],
  envelopeId: string,
  category: string | undefined,
  monthAnchor = todayKey()
): number {
  const monthKey = monthAnchor.slice(0, 7);
  let sum = 0;
  for (const t of transactions) {
    if (t.type !== 'gasto') continue;
    if (!t.date.startsWith(monthKey)) continue;
    if (t.envelopeId === envelopeId) {
      sum += t.amount;
      continue;
    }
    if (!t.envelopeId && category && t.category === category) {
      sum += t.amount;
    }
  }
  return Math.round(sum * 100) / 100;
}

export function weekSpend(transactions: Transaction[], weekAnchor = todayKey()): number {
  return filterByPeriod(transactions, 'week', weekAnchor)
    .filter((t) => t.type === 'gasto')
    .reduce((a, t) => a + t.amount, 0);
}
