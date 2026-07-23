import type { FinanceState } from '../types/finance';
import { monthKey, todayKey } from './categories';
import { buildBudgetRows, budgetTotals } from './budgets';
import { summarizePeriod } from './periods';

export type HealthTone = 'great' | 'ok' | 'warn' | 'bad';

export interface HealthFactor {
  id: string;
  label: string;
  score: number; // 0–100
  tip: string;
}

export interface HealthScoreResult {
  score: number;
  tone: HealthTone;
  label: string;
  factors: HealthFactor[];
  headline: string;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function toneFromScore(score: number): HealthTone {
  if (score >= 80) return 'great';
  if (score >= 60) return 'ok';
  if (score >= 40) return 'warn';
  return 'bad';
}

function labelFromTone(tone: HealthTone): string {
  if (tone === 'great') return 'Excelente';
  if (tone === 'ok') return 'Bien';
  if (tone === 'warn') return 'Atención';
  return 'Crítico';
}

/**
 * Score 0–100 a partir de ahorro del mes, presupuestos, efectivo y metas.
 * Pensado para home / reportes — no es un score bancario.
 */
export function computeHealthScore(state: FinanceState): HealthScoreResult {
  const today = todayKey();
  const month = summarizePeriod(state.transactions, 'month', today);
  const week = summarizePeriod(state.transactions, 'week', today);
  const hasActivity =
    state.transactions.length > 0 ||
    (state.goals?.length ?? 0) > 0 ||
    (state.fixedExpenses?.length ?? 0) > 0 ||
    Object.keys(state.categoryBudgets ?? {}).length > 0 ||
    state.cashNow > 0;

  // Sin datos todavía: score neutro (no asustar)
  if (!hasActivity) {
    return {
      score: 70,
      tone: 'ok',
      label: 'Listo para empezar',
      factors: [
        {
          id: 'savings',
          label: 'Ahorro del mes',
          score: 70,
          tip: 'Cargá un ingreso y 2–3 gastos para medir el ahorro.',
        },
        {
          id: 'budgets',
          label: 'Presupuestos',
          score: 70,
          tip: 'Definí topes por categoría cuando quieras cuidarte el mes.',
        },
        {
          id: 'cash',
          label: 'Efectivo',
          score: 70,
          tip: 'Actualizá tu efectivo en Ahorro para un score más real.',
        },
        {
          id: 'goals',
          label: 'Metas',
          score: 70,
          tip: 'Creá una meta de ahorro para darle dirección al dinero.',
        },
      ],
      headline: 'Cargá movimientos y el score se pone a trabajar.',
    };
  }

  // 1) Tasa de ahorro del mes
  const income = month.giro;
  const out = month.gasto + month.inversion;
  const savingsRate = income > 0 ? ((income - out) / income) * 100 : week.libre >= 0 ? 40 : 10;
  const savingsScore = clamp(
    income <= 0 && out <= 0
      ? 55
      : savingsRate >= 30
        ? 100
        : savingsRate >= 20
          ? 85
          : savingsRate >= 10
            ? 70
            : savingsRate >= 0
              ? 55
              : savingsRate >= -20
                ? 30
                : 10
  );

  // 2) Presupuestos
  const budgetRows = buildBudgetRows(state, monthKey(today));
  const totals = budgetTotals(budgetRows);
  let budgetScore = 70;
  let budgetTip = 'Definí presupuestos por categoría para cuidar el mes.';
  if (budgetRows.length === 0) {
    budgetScore = 55;
  } else if (totals.overCount > 0) {
    budgetScore = clamp(100 - totals.overCount * 25 - totals.warnCount * 8);
    budgetTip = `${totals.overCount} categoría${totals.overCount === 1 ? '' : 's'} pasaron el tope.`;
  } else if (totals.warnCount > 0) {
    budgetScore = 72;
    budgetTip = `${totals.warnCount} categoría${totals.warnCount === 1 ? '' : 's'} cerca del tope.`;
  } else {
    budgetScore = 95;
    budgetTip = 'Vas dentro de tus presupuestos del mes.';
  }

  // 3) Efectivo vs gasto semanal
  const weeklyBurn = Math.max(week.gasto, 1);
  const cashDays = state.cashNow / (weeklyBurn / 7);
  const cashScore = clamp(
    state.cashNow <= 0 && week.gasto > 0
      ? 15
      : cashDays >= 21
        ? 100
        : cashDays >= 14
          ? 85
          : cashDays >= 7
            ? 65
            : cashDays >= 3
              ? 40
              : 20
  );

  // 4) Metas
  const goals = state.goals ?? [];
  let goalsScore = 60;
  let goalsTip = 'Creá una meta de ahorro para darle dirección al dinero.';
  if (goals.length > 0) {
    const progresses = goals.map((g) =>
      g.targetAmount > 0 ? clamp((g.currentAmount / g.targetAmount) * 100) : 0
    );
    const avg = progresses.reduce((a, b) => a + b, 0) / progresses.length;
    goalsScore = clamp(40 + avg * 0.6);
    goalsTip =
      avg >= 70
        ? 'Tus metas van muy bien.'
        : avg >= 30
          ? 'Seguí aportando a tus metas.'
          : 'Tus metas necesitan más aportes este mes.';
  }

  const factors: HealthFactor[] = [
    {
      id: 'savings',
      label: 'Ahorro del mes',
      score: Math.round(savingsScore),
      tip:
        income > 0
          ? `Estás ahorrando ~${Math.round(savingsRate)}% de tus ingresos.`
          : 'Cargá ingresos del mes para medir mejor el ahorro.',
    },
    {
      id: 'budgets',
      label: 'Presupuestos',
      score: Math.round(budgetScore),
      tip: budgetTip,
    },
    {
      id: 'cash',
      label: 'Efectivo',
      score: Math.round(cashScore),
      tip:
        state.cashNow <= 0
          ? 'Actualizá tu efectivo en Ahorro para un score más real.'
          : `Con el ritmo de esta semana, el efectivo rinde ~${Math.max(0, Math.round(cashDays))} días.`,
    },
    {
      id: 'goals',
      label: 'Metas',
      score: Math.round(goalsScore),
      tip: goalsTip,
    },
  ];

  const score = Math.round(
    factors[0].score * 0.35 +
      factors[1].score * 0.3 +
      factors[2].score * 0.2 +
      factors[3].score * 0.15
  );
  const tone = toneFromScore(score);

  return {
    score,
    tone,
    label: labelFromTone(tone),
    factors,
    headline:
      tone === 'great'
        ? 'Tu plata está bajo control.'
        : tone === 'ok'
          ? 'Vas bien; hay margen para afinar.'
          : tone === 'warn'
            ? 'Conviene ajustar gastos esta semana.'
            : 'Priorizá ingresos y frená gastos grandes.',
  };
}
