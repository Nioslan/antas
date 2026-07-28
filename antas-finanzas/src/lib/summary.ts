import type {
  CapitalSummary,
  DaySummary,
  Transaction,
} from '../types/finance';
import { isInDay, isInMonth, monthKey, todayKey } from './categories';

function recoveredOf(t: Transaction): number {
  if (t.type !== 'giro') return 0;
  const recovered = t.recovered ?? t.amount;
  return Math.min(Math.max(recovered, 0), t.amount);
}

function profitOf(t: Transaction): number {
  if (t.type !== 'giro') return 0;
  return Math.max(t.amount - recoveredOf(t), 0);
}

export function summarizeDay(
  transactions: Transaction[],
  day = todayKey()
): DaySummary {
  let inversion = 0;
  let gasto = 0;
  let giro = 0;
  let recuperado = 0;
  let ganancia = 0;

  for (const t of transactions) {
    if (!isInDay(t.date, day)) continue;
    if (t.type === 'inversion') inversion += t.amount;
    else if (t.type === 'gasto') gasto += t.amount;
    else {
      giro += t.amount;
      recuperado += recoveredOf(t);
      ganancia += profitOf(t);
    }
  }

  return {
    inversion,
    gasto,
    giro,
    recuperado,
    ganancia,
    libre: giro - gasto - inversion,
  };
}

export function summarizeCapital(
  transactions: Transaction[],
  monthOnly = false,
  key = monthKey()
): CapitalSummary {
  let invertidoTotal = 0;
  let recuperadoTotal = 0;
  let gananciaTotal = 0;
  let gastoTotal = 0;

  for (const t of transactions) {
    if (monthOnly && !isInMonth(t.date, key)) continue;
    if (t.type === 'inversion') invertidoTotal += t.amount;
    else if (t.type === 'gasto') gastoTotal += t.amount;
    else {
      recuperadoTotal += recoveredOf(t);
      gananciaTotal += profitOf(t);
    }
  }

  return {
    invertidoTotal,
    recuperadoTotal,
    pendiente: Math.max(invertidoTotal - recuperadoTotal, 0),
    gananciaTotal,
    gastoTotal,
  };
}

export { recoveredOf, profitOf };
