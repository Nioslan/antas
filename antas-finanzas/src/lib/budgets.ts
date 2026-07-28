import type { FinanceState, Transaction } from '../types/finance';
import { getCategoryLabel, monthKey } from './categories';
import { filterByPeriod } from './periods';

export type BudgetStatus = 'ok' | 'warn' | 'over' | 'empty';

export interface CategoryBudgetRow {
  category: string;
  label: string;
  limit: number;
  spent: number;
  remaining: number;
  pct: number;
  status: BudgetStatus;
}

export function spentByCategoryGasto(
  transactions: Transaction[],
  monthAnchor: string
): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of filterByPeriod(transactions, 'month', monthAnchor)) {
    if (t.type !== 'gasto') continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return map;
}

export function budgetStatus(spent: number, limit: number): BudgetStatus {
  if (!(limit > 0)) return 'empty';
  const pct = spent / limit;
  if (pct >= 1) return 'over';
  if (pct >= 0.85) return 'warn';
  return 'ok';
}

/** Filas de presupuesto del mes (solo categorías con límite > 0). */
export function buildBudgetRows(
  state: FinanceState,
  monthAnchor = monthKey()
): CategoryBudgetRow[] {
  const budgets = state.categoryBudgets ?? {};
  const spentMap = spentByCategoryGasto(state.transactions, monthAnchor);
  const rows: CategoryBudgetRow[] = [];

  for (const [category, limitRaw] of Object.entries(budgets)) {
    const limit = Number(limitRaw) || 0;
    if (limit <= 0) continue;
    const spent = spentMap.get(category) ?? 0;
    const remaining = Math.round((limit - spent) * 100) / 100;
    const pct = limit > 0 ? Math.min(999, (spent / limit) * 100) : 0;
    rows.push({
      category,
      label: getCategoryLabel('gasto', category),
      limit,
      spent,
      remaining,
      pct,
      status: budgetStatus(spent, limit),
    });
  }

  return rows.sort((a, b) => b.pct - a.pct);
}

export function budgetTotals(rows: CategoryBudgetRow[]): {
  limit: number;
  spent: number;
  remaining: number;
  overCount: number;
  warnCount: number;
} {
  let limit = 0;
  let spent = 0;
  let overCount = 0;
  let warnCount = 0;
  for (const r of rows) {
    limit += r.limit;
    spent += r.spent;
    if (r.status === 'over') overCount += 1;
    else if (r.status === 'warn') warnCount += 1;
  }
  return {
    limit,
    spent,
    remaining: Math.round((limit - spent) * 100) / 100,
    overCount,
    warnCount,
  };
}
