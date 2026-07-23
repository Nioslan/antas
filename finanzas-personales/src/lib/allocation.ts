import type { AllocationRule, FinanceState } from '../types/finance';
import { DEFAULT_ALLOCATION } from '../types/finance';
import { todayKey } from './categories';
import { filterByPeriod } from './periods';

const NEED_CATS = new Set([
  'vivienda',
  'comida',
  'transporte',
  'gasolina',
  'salud',
]);
const WANT_CATS = new Set(['ocio', 'personal', 'otros']);
const SAVE_CATS = new Set(['inversiones', 'ahorro']);

export type BucketKey = 'needs' | 'wants' | 'savings';

export interface AllocationBreakdown {
  rule: AllocationRule;
  income: number;
  needs: { amount: number; target: number; pct: number };
  wants: { amount: number; target: number; pct: number };
  savings: { amount: number; target: number; pct: number };
  status: 'ok' | 'warn' | 'off';
  tip: string;
}

function bucketForCategory(category: string): BucketKey {
  if (NEED_CATS.has(category)) return 'needs';
  if (SAVE_CATS.has(category)) return 'savings';
  if (WANT_CATS.has(category)) return 'wants';
  return 'wants';
}

export function analyzeAllocation(
  state: FinanceState,
  monthAnchor = todayKey()
): AllocationBreakdown {
  const rule = state.allocationRule ?? DEFAULT_ALLOCATION;
  const txs = filterByPeriod(state.transactions, 'month', monthAnchor);
  let income = 0;
  let needsAmt = 0;
  let wantsAmt = 0;
  let savingsAmt = 0;

  for (const t of txs) {
    if (t.type === 'giro') {
      income += t.amount;
      continue;
    }
    if (t.type === 'inversion') {
      savingsAmt += t.amount;
      continue;
    }
    if (t.type === 'gasto') {
      const b = bucketForCategory(t.category);
      if (b === 'needs') needsAmt += t.amount;
      else if (b === 'savings') savingsAmt += t.amount;
      else wantsAmt += t.amount;
    }
  }

  // Aportes a metas cuentan como ahorro
  for (const g of state.goals ?? []) {
    // no double-count from txs; goals.currentAmount is cumulative — skip for monthly
  }

  const targetNeeds = (income * rule.needs) / 100;
  const targetWants = (income * rule.wants) / 100;
  const targetSavings = (income * rule.savings) / 100;

  const pct = (amount: number) =>
    income > 0 ? Math.round((amount / income) * 1000) / 10 : 0;

  const needsOver = income > 0 && needsAmt > targetNeeds * 1.1;
  const wantsOver = income > 0 && wantsAmt > targetWants * 1.1;
  const savingsLow = income > 0 && savingsAmt < targetSavings * 0.5;

  let status: AllocationBreakdown['status'] = 'ok';
  let tip = 'Vas alineado a tu regla de %.';
  if (income <= 0) {
    status = 'warn';
    tip = 'Cargá ingresos del mes para medir la regla 50/30/20.';
  } else if (needsOver || wantsOver) {
    status = 'off';
    tip = needsOver
      ? 'Necesidades pasaron el %. Revisá vivienda/comida/transporte.'
      : 'Gustos pasaron el %. Recortá ocio/personal esta semana.';
  } else if (savingsLow) {
    status = 'warn';
    tip = 'El ahorro va bajo vs tu %. Mandá algo a Ahorro o metas.';
  }

  return {
    rule,
    income,
    needs: { amount: needsAmt, target: targetNeeds, pct: pct(needsAmt) },
    wants: { amount: wantsAmt, target: targetWants, pct: pct(wantsAmt) },
    savings: { amount: savingsAmt, target: targetSavings, pct: pct(savingsAmt) },
    status,
    tip,
  };
}
