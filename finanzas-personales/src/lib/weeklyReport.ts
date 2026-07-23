import type { FinanceState } from '../types/finance';
import { analyzeAllocation } from './allocation';
import { formatMoney, todayKey } from './categories';
import {
  filterByPeriod,
  formatWeekLabel,
  getWeekRange,
  shiftWeek,
  summarizePeriod,
} from './periods';
import { projectMonthEnd } from './projection';
import { buildBudgetRows, budgetTotals } from './budgets';

export interface WeeklyReport {
  title: string;
  body: string;
  weekLibre: number;
  weekGasto: number;
  weekIngreso: number;
  generatedAt: string;
}

export function buildWeeklyReport(state: FinanceState, weekAnchor = todayKey()): WeeklyReport {
  const week = summarizePeriod(state.transactions, 'week', weekAnchor);
  const prev = summarizePeriod(state.transactions, 'week', shiftWeek(weekAnchor, -1));
  const alloc = analyzeAllocation(state);
  const proj = projectMonthEnd(state);
  const budgets = budgetTotals(buildBudgetRows(state));
  const top = filterByPeriod(state.transactions, 'week', weekAnchor)
    .filter((t) => t.type === 'gasto')
    .sort((a, b) => b.amount - a.amount)[0];

  const delta =
    prev.gasto > 0
      ? Math.round(((week.gasto - prev.gasto) / prev.gasto) * 100)
      : null;

  const tip =
    week.libre < 0
      ? 'Tip: esta semana quedaste en rojo — cortá un gasto de ocio y revisá fijos.'
      : budgets.overCount > 0
        ? `Tip: ${budgets.overCount} presupuesto${budgets.overCount === 1 ? '' : 's'} pasado${budgets.overCount === 1 ? '' : 's'}. Ajustá esa categoría.`
        : alloc.status !== 'ok'
          ? `Tip: ${alloc.tip}`
          : proj.projectedLibre < 0
            ? 'Tip: la proyección del mes viene justa — congelá gastos grandes.'
            : 'Tip: mandá una parte del libre a Ahorro o a una meta esta semana.';

  const lines = [
    `Informe · ${formatWeekLabel(weekAnchor)}`,
    '',
    `Ingresos: ${formatMoney(week.giro)}`,
    `Gastos: ${formatMoney(week.gasto)}`,
    `Libre: ${formatMoney(week.libre)}`,
    delta == null
      ? 'Sin base de la semana anterior.'
      : `Gastos ${delta >= 0 ? '+' : ''}${delta}% vs semana anterior.`,
    top
      ? `Mayor gasto: ${formatMoney(top.amount)}${top.note ? ` (${top.note})` : ''}.`
      : 'Sin gastos cargados esta semana.',
    `Proyección mes: libre ~${formatMoney(proj.projectedLibre)}.`,
    '',
    tip,
  ];

  return {
    title: 'Tu informe semanal',
    body: lines.join('\n'),
    weekLibre: week.libre,
    weekGasto: week.gasto,
    weekIngreso: week.giro,
    generatedAt: new Date().toISOString(),
  };
}

/** Próximo domingo 18:00 local (o hoy si ya es domingo y aún no pasó). */
export function nextSundayEvening(from = new Date()): Date {
  const d = new Date(from);
  const day = d.getDay(); // 0 domingo
  let add = (7 - day) % 7;
  const candidate = new Date(d);
  candidate.setDate(d.getDate() + add);
  candidate.setHours(18, 0, 0, 0);
  if (candidate.getTime() <= from.getTime()) {
    candidate.setDate(candidate.getDate() + 7);
  }
  return candidate;
}

export function weekRangeLabel(anchor = todayKey()): string {
  const { start, end } = getWeekRange(anchor);
  return `${start} → ${end}`;
}
