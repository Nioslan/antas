import type { FinanceState, Goal, Transaction } from '../types/finance';
import {
  formatMoney,
  getCategoryLabel,
  todayKey,
} from './categories';
import {
  filterByPeriod,
  getWeekRange,
  shiftWeek,
  summarizePeriod,
} from './periods';
import { previewSaturdayBonus } from './saturdayBonus';

export interface CategoryTotal {
  category: string;
  label: string;
  amount: number;
  share: number;
}

export interface CoachSnapshot {
  dayLibre: number;
  dayIngreso: number;
  dayGasto: number;
  weekLibre: number;
  weekIngreso: number;
  weekGasto: number;
  prevWeekLibre: number;
  monthLibre: number;
  monthIngreso: number;
  monthGasto: number;
  savingsRateWeek: number;
  avgDailySpendWeek: number;
  topWeekExpenses: CategoryTotal[];
  topMonthExpenses: CategoryTotal[];
  cashNow: number;
  saturdayBonus: number;
  weekLibreForBonus: number;
  bonusAlreadyApplied: boolean;
  goals: Goal[];
  recentNotes: string[];
  txCountWeek: number;
  biggestExpense?: Transaction;
  biggestIncome?: Transaction;
}

function expenseTotals(
  transactions: Transaction[]
): { category: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'gasto') continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function toCategoryTotals(
  rows: { category: string; amount: number }[],
  total: number
): CategoryTotal[] {
  return rows.slice(0, 5).map((r) => ({
    category: r.category,
    label: getCategoryLabel('gasto', r.category),
    amount: r.amount,
    share: total > 0 ? (r.amount / total) * 100 : 0,
  }));
}

export function buildCoachSnapshot(
  state: FinanceState,
  bonusPercent = 20
): CoachSnapshot {
  const today = todayKey();
  const day = summarizePeriod(state.transactions, 'day', today);
  const week = summarizePeriod(state.transactions, 'week', today);
  const prevAnchor = shiftWeek(today, -1);
  const prevWeek = summarizePeriod(state.transactions, 'week', prevAnchor);
  const month = summarizePeriod(state.transactions, 'month', today);

  const weekTx = filterByPeriod(state.transactions, 'week', today);
  const monthTx = filterByPeriod(state.transactions, 'month', today);
  const weekExpenses = expenseTotals(weekTx);
  const monthExpenses = expenseTotals(monthTx);

  const { start } = getWeekRange(today);
  const [ys, ms, ds] = start.split('-').map(Number);
  const [yt, mt, dt] = today.split('-').map(Number);
  const startMs = new Date(ys, ms - 1, ds).getTime();
  const todayMs = new Date(yt, mt - 1, dt).getTime();
  const daysElapsed = Math.max(
    1,
    Math.min(7, Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1)
  );

  const bonus = previewSaturdayBonus(state, bonusPercent);

  const gastos = weekTx.filter((t) => t.type === 'gasto');
  const ingresos = weekTx.filter((t) => t.type === 'giro');
  const biggestExpense = [...gastos].sort((a, b) => b.amount - a.amount)[0];
  const biggestIncome = [...ingresos].sort((a, b) => b.amount - a.amount)[0];

  const recentNotes = state.transactions
    .filter((t) => t.note.trim())
    .slice(0, 6)
    .map(
      (t) =>
        `${t.date} ${t.type === 'giro' ? 'ingreso' : 'gasto'} ${getCategoryLabel(t.type, t.category)}: ${formatMoney(t.amount)} — ${t.note}`
    );

  return {
    dayLibre: day.libre,
    dayIngreso: day.giro,
    dayGasto: day.gasto,
    weekLibre: week.libre,
    weekIngreso: week.giro,
    weekGasto: week.gasto,
    prevWeekLibre: prevWeek.libre,
    monthLibre: month.libre,
    monthIngreso: month.giro,
    monthGasto: month.gasto,
    savingsRateWeek:
      week.giro > 0 ? (week.libre / week.giro) * 100 : week.libre < 0 ? -100 : 0,
    avgDailySpendWeek: week.gasto / daysElapsed,
    topWeekExpenses: toCategoryTotals(weekExpenses, week.gasto),
    topMonthExpenses: toCategoryTotals(monthExpenses, month.gasto),
    cashNow: state.cashNow,
    saturdayBonus: bonus.bonus,
    weekLibreForBonus: bonus.weekLibre,
    bonusAlreadyApplied: bonus.alreadyApplied,
    goals: state.goals,
    recentNotes,
    txCountWeek: weekTx.length,
    biggestExpense,
    biggestIncome,
  };
}

export function formatSnapshotForPrompt(s: CoachSnapshot): string {
  const topWeek =
    s.topWeekExpenses.length === 0
      ? '- Sin gastos esta semana'
      : s.topWeekExpenses
          .map(
            (c) =>
              `- ${c.label}: ${formatMoney(c.amount)} (${c.share.toFixed(0)}% de gastos)`
          )
          .join('\n');

  const topMonth =
    s.topMonthExpenses.length === 0
      ? '- Sin gastos este mes'
      : s.topMonthExpenses
          .map(
            (c) =>
              `- ${c.label}: ${formatMoney(c.amount)} (${c.share.toFixed(0)}%)`
          )
          .join('\n');

  const goals =
    s.goals.length === 0
      ? '- Sin metas cargadas'
      : s.goals
          .map((g) => {
            const left = Math.max(g.targetAmount - g.currentAmount, 0);
            const pct = g.targetAmount
              ? Math.round((g.currentAmount / g.targetAmount) * 100)
              : 0;
            const weeks =
              s.weekLibre > 0 ? Math.ceil(left / (s.weekLibre * 0.2)) : null;
            return `- ${g.name}: ${formatMoney(g.currentAmount)} / ${formatMoney(g.targetAmount)} (${pct}%). Falta ${formatMoney(left)}${
              weeks && weeks < 520
                ? `. Si destinás el 20% del libre semanal (~${formatMoney(s.weekLibre * 0.2)}), ~${weeks} semanas`
                : ''
            }`;
          })
          .join('\n');

  const weekDelta = s.weekLibre - s.prevWeekLibre;
  const weekDeltaText =
    weekDelta === 0
      ? 'igual que la semana pasada'
      : weekDelta > 0
        ? `${formatMoney(weekDelta)} mejor que la semana pasada`
        : `${formatMoney(Math.abs(weekDelta))} peor que la semana pasada`;

  return `
HOY:
- Ingresos ${formatMoney(s.dayIngreso)} · Gastos ${formatMoney(s.dayGasto)} · Libre ${formatMoney(s.dayLibre)}

ESTA SEMANA (lun–dom):
- Ingresos ${formatMoney(s.weekIngreso)} · Gastos ${formatMoney(s.weekGasto)} · Libre ${formatMoney(s.weekLibre)}
- Tasa de ahorro semanal: ${s.savingsRateWeek.toFixed(1)}%
- Promedio de gasto por día (hasta hoy): ${formatMoney(s.avgDailySpendWeek)}
- Comparación: ${weekDeltaText}
- Movimientos esta semana: ${s.txCountWeek}
${
  s.biggestExpense
    ? `- Gasto más grande: ${getCategoryLabel('gasto', s.biggestExpense.category)} ${formatMoney(s.biggestExpense.amount)}${s.biggestExpense.note ? ` (${s.biggestExpense.note})` : ''}`
    : ''
}
${
  s.biggestIncome
    ? `- Ingreso más grande: ${getCategoryLabel('giro', s.biggestIncome.category)} ${formatMoney(s.biggestIncome.amount)}${s.biggestIncome.note ? ` (${s.biggestIncome.note})` : ''}`
    : ''
}

TOP GASTOS SEMANA:
${topWeek}

ESTE MES:
- Ingresos ${formatMoney(s.monthIngreso)} · Gastos ${formatMoney(s.monthGasto)} · Libre ${formatMoney(s.monthLibre)}

TOP GASTOS MES:
${topMonth}

AHORA (efectivo en mano): ${formatMoney(s.cashNow)}
BONO SÁBADO (20% del libre semanal): ${formatMoney(s.saturdayBonus)} sobre libre ${formatMoney(s.weekLibreForBonus)}${s.bonusAlreadyApplied ? ' · YA APLICADO esta semana' : ' · pendiente de aplicar el sábado'}

METAS:
${goals}

NOTAS RECIENTES:
${s.recentNotes.length ? s.recentNotes.map((n) => `- ${n}`).join('\n') : '- Sin notas'}
`.trim();
}
