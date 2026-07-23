import type { FinanceState, Transaction } from '../types/finance';
import { getCategoryLabel, typeLabel } from './categories';

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function row(cols: (string | number)[]): string {
  return cols.map((c) => escapeCsv(String(c))).join(',');
}

export function transactionsToCsv(transactions: Transaction[]): string {
  const header = row([
    'fecha',
    'hora',
    'tipo',
    'categoria',
    'monto',
    'nota',
    'id',
  ]);
  const lines = [...transactions]
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.time ?? '').localeCompare(a.time ?? '');
    })
    .map((t) =>
      row([
        t.date,
        t.time ?? '',
        typeLabel(t.type),
        getCategoryLabel(t.type, t.category),
        t.amount.toFixed(2),
        t.note ?? '',
        t.id,
      ])
    );
  return [header, ...lines].join('\n');
}

export function financeStateToCsvBundle(state: FinanceState): string {
  const parts = [
    '# Movimientos',
    transactionsToCsv(state.transactions),
    '',
    '# Metas',
    row(['nombre', 'objetivo', 'actual', 'plazo', 'id']),
    ...state.goals.map((g) =>
      row([g.name, g.targetAmount.toFixed(2), g.currentAmount.toFixed(2), g.deadline ?? '', g.id])
    ),
    '',
    '# Presupuestos (mes)',
    row(['categoria', 'tope']),
    ...Object.entries(state.categoryBudgets ?? {}).map(([cat, limit]) =>
      row([getCategoryLabel('gasto', cat), Number(limit).toFixed(2)])
    ),
  ];
  return parts.join('\n');
}
