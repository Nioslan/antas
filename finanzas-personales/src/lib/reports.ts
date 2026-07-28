import type { DaySummary, FinanceState, Transaction } from '../types/finance';
import { getCategoryLabel } from './categories';
import {
  filterByPeriod,
  shiftPeriod,
  summarizePeriod,
  type Period,
} from './periods';

export interface ReportCategoryRow {
  category: string;
  label: string;
  amount: number;
  share: number;
}

export interface MonthPoint {
  key: string;
  label: string;
  ingreso: number;
  gasto: number;
  libre: number;
}

export interface FinanceReport {
  period: Period;
  anchor: string;
  current: DaySummary;
  previous: DaySummary;
  deltaLibre: number;
  deltaGastoPct: number | null;
  topExpenses: ReportCategoryRow[];
  topIncomes: ReportCategoryRow[];
  txCount: number;
  avgTicketGasto: number;
  trendMonths: MonthPoint[];
}

function totalsByCategory(
  transactions: Transaction[],
  type: 'gasto' | 'giro'
): ReportCategoryRow[] {
  const map = new Map<string, number>();
  let total = 0;
  for (const t of transactions) {
    if (t.type !== type) continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    total += t.amount;
  }
  return [...map.entries()]
    .map(([category, amount]) => ({
      category,
      label: getCategoryLabel(type, category),
      amount,
      share: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);
}

const MONTH_SHORT = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

function monthPoints(transactions: Transaction[], months = 6): MonthPoint[] {
  const now = new Date();
  const points: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-15`;
    const s = summarizePeriod(transactions, 'month', key);
    points.push({
      key: key.slice(0, 7),
      label: MONTH_SHORT[d.getMonth()],
      ingreso: s.giro,
      gasto: s.gasto,
      libre: s.libre,
    });
  }
  return points;
}

export function buildFinanceReport(
  state: FinanceState,
  period: Period,
  anchor: string
): FinanceReport {
  const current = summarizePeriod(state.transactions, period, anchor);
  const prevAnchor = shiftPeriod(period, anchor, -1);
  const previous = summarizePeriod(state.transactions, period, prevAnchor);
  const txs = filterByPeriod(state.transactions, period, anchor);
  const gastos = txs.filter((t) => t.type === 'gasto');
  const gastoSum = gastos.reduce((a, t) => a + t.amount, 0);

  const deltaLibre = Math.round((current.libre - previous.libre) * 100) / 100;
  const deltaGastoPct =
    previous.gasto > 0
      ? Math.round(((current.gasto - previous.gasto) / previous.gasto) * 1000) / 10
      : null;

  return {
    period,
    anchor,
    current,
    previous,
    deltaLibre,
    deltaGastoPct,
    topExpenses: totalsByCategory(txs, 'gasto'),
    topIncomes: totalsByCategory(txs, 'giro'),
    txCount: txs.length,
    avgTicketGasto: gastos.length ? gastoSum / gastos.length : 0,
    trendMonths: monthPoints(state.transactions, 6),
  };
}
