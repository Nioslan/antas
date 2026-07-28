import type { FinanceState } from '../types/finance';
import { buildBudgetRows } from './budgets';
import { formatMoney, getCategoryLabel, monthKey, todayKey } from './categories';
import { filterByPeriod, shiftWeek, summarizePeriod } from './periods';
import { weekSpend } from './projection';

export type SmartAlertKind =
  | 'budget_over'
  | 'unusual_spend'
  | 'fixed_soon'
  | 'debt_due'
  | 'challenge'
  | 'pace';

export interface SmartAlert {
  id: string;
  kind: SmartAlertKind;
  title: string;
  body: string;
  severity: 'info' | 'warn' | 'danger';
}

export function buildSmartAlerts(state: FinanceState): SmartAlert[] {
  const today = todayKey();
  const dayKey = today;
  const alerts: SmartAlert[] = [];
  const dismissed = new Set(state.dismissedAlertIds ?? []);

  const budgets = buildBudgetRows(state, monthKey(today));
  for (const row of budgets) {
    if (row.status === 'over') {
      alerts.push({
        id: `${dayKey}:budget_over:${row.category}`,
        kind: 'budget_over',
        title: `${row.label} pasó el presupuesto`,
        body: `Gastaste ${formatMoney(row.spent)} de ${formatMoney(row.limit)}.`,
        severity: 'danger',
      });
    } else if (row.status === 'warn') {
      alerts.push({
        id: `${dayKey}:budget_warn:${row.category}`,
        kind: 'budget_over',
        title: `${row.label} cerca del tope`,
        body: `Vas al ${Math.round(row.pct)}% del presupuesto.`,
        severity: 'warn',
      });
    }
  }

  // Gasto raro vs promedio diario del mes
  const monthTx = filterByPeriod(state.transactions, 'month', today).filter(
    (t) => t.type === 'gasto'
  );
  if (monthTx.length >= 5) {
    const byDay = new Map<string, number>();
    for (const t of monthTx) {
      byDay.set(t.date, (byDay.get(t.date) ?? 0) + t.amount);
    }
    const days = [...byDay.values()];
    const avg = days.reduce((a, b) => a + b, 0) / days.length;
    const todaySpend = byDay.get(today) ?? 0;
    if (avg > 0 && todaySpend > avg * 2.2 && todaySpend > 20) {
      alerts.push({
        id: `${dayKey}:unusual`,
        kind: 'unusual_spend',
        title: 'Gasto alto hoy',
        body: `Hoy llevás ${formatMoney(todaySpend)} vs promedio diario ${formatMoney(avg)}.`,
        severity: 'warn',
      });
    }
    const biggest = [...monthTx].sort((a, b) => b.amount - a.amount)[0];
    if (biggest && biggest.amount > avg * 3 && biggest.date === today) {
      alerts.push({
        id: `${dayKey}:spike:${biggest.id}`,
        kind: 'unusual_spend',
        title: 'Movimiento llamativo',
        body: `${getCategoryLabel('gasto', biggest.category)} ${formatMoney(biggest.amount)}.`,
        severity: 'info',
      });
    }
  }

  const dayNum = Number(today.slice(8, 10));
  for (const f of state.fixedExpenses ?? []) {
    if (!f.enabled) continue;
    const diff = f.dueDay - dayNum;
    if (diff >= 0 && diff <= 3) {
      const paid = f.lastPaidDate?.startsWith(today.slice(0, 7));
      if (!paid) {
        alerts.push({
          id: `${dayKey}:fixed:${f.id}`,
          kind: 'fixed_soon',
          title: diff === 0 ? `Hoy vence ${f.name}` : `${f.name} en ${diff} día${diff === 1 ? '' : 's'}`,
          body: `Fijo de ${formatMoney(f.amount)}.`,
          severity: diff === 0 ? 'danger' : 'warn',
        });
      }
    }
  }

  for (const d of state.debts ?? []) {
    if (!d.dueDay || d.remaining <= 0) continue;
    const diff = d.dueDay - dayNum;
    if (diff >= 0 && diff <= 3) {
      alerts.push({
        id: `${dayKey}:debt:${d.id}`,
        kind: 'debt_due',
        title:
          d.kind === 'i_owe'
            ? `Cuota de ${d.name}`
            : `Te pueden pagar ${d.name}`,
        body: `Saldo ${formatMoney(d.remaining)}${
          d.installmentAmount ? ` · cuota ${formatMoney(d.installmentAmount)}` : ''
        }.`,
        severity: 'warn',
      });
    }
  }

  const week = summarizePeriod(state.transactions, 'week', today);
  const prev = summarizePeriod(state.transactions, 'week', shiftWeek(today, -1));
  if (prev.gasto > 0 && week.gasto > prev.gasto * 1.35 && week.gasto > 50) {
    alerts.push({
      id: `${dayKey}:pace`,
      kind: 'pace',
      title: 'Gastás más que la semana pasada',
      body: `${formatMoney(week.gasto)} vs ${formatMoney(prev.gasto)} anterior.`,
      severity: 'warn',
    });
  }

  for (const c of state.challenges ?? []) {
    if (!c.active) continue;
    if (today > c.endDate) continue;
    if (c.type === 'spend_less_week') {
      const spent = weekSpend(state.transactions, today);
      const limit = c.targetAmount || c.baselineSpend || 0;
      if (limit > 0 && spent >= limit * 0.85) {
        alerts.push({
          id: `${dayKey}:challenge:${c.id}`,
          kind: 'challenge',
          title: `Reto: ${c.title}`,
          body: `Vas ${formatMoney(spent)} de ${formatMoney(limit)} esta semana.`,
          severity: spent > limit ? 'danger' : 'warn',
        });
      }
    }
  }

  return alerts.filter((a) => !dismissed.has(a.id)).slice(0, 6);
}
