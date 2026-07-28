import type {
  AllocationRule,
  ChallengeType,
  Debt,
  DebtKind,
  Envelope,
  FinanceState,
  HouseholdMember,
  SavingsChallenge,
  Transaction,
} from '../types/finance';
import { DEFAULT_ALLOCATION } from '../types/finance';
import type { FixedExpense } from '../types/fixed';

export function normalizeBudgets(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(value);
    if (!key || !Number.isFinite(n) || n <= 0) continue;
    out[key] = Math.round(n * 100) / 100;
  }
  return out;
}

export function normalizeFixed(list: unknown): FixedExpense[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item === 'object')
    .map((raw) => {
      const item = raw as Partial<FixedExpense>;
      return {
        id: String(item.id ?? ''),
        name: String(item.name ?? 'Gasto fijo'),
        amount: Number(item.amount) || 0,
        dueDay: Math.min(31, Math.max(1, Number(item.dueDay) || 1)),
        category: (item.category as FixedExpense['category']) ?? 'vivienda',
        enabled: item.enabled !== false,
        lastPaidDate: item.lastPaidDate,
        learnedDays: Array.isArray(item.learnedDays)
          ? item.learnedDays.filter((n) => typeof n === 'number')
          : [],
        createdAt: item.createdAt ?? new Date().toISOString(),
        updatedAt: item.updatedAt ?? new Date().toISOString(),
      };
    })
    .filter((f) => f.id);
}

function normalizeTransactions(list: unknown): Transaction[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((t) => t && typeof t === 'object')
    .map((raw) => {
      const t = raw as Transaction;
      return {
        ...t,
        id: String(t.id ?? ''),
        type: t.type,
        amount: Number(t.amount) || 0,
        category: String(t.category ?? 'otros'),
        note: String(t.note ?? ''),
        date: String(t.date ?? ''),
        time: t.time,
        createdAt: t.createdAt ?? new Date().toISOString(),
        recovered: t.recovered,
        receiptUri: typeof t.receiptUri === 'string' ? t.receiptUri : undefined,
        memberId: typeof t.memberId === 'string' ? t.memberId : undefined,
        envelopeId: typeof t.envelopeId === 'string' ? t.envelopeId : undefined,
      };
    })
    .filter((t) => t.id && t.date);
}

export function normalizeEnvelopes(list: unknown): Envelope[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((e) => e && typeof e === 'object')
    .map((raw) => {
      const e = raw as Partial<Envelope>;
      return {
        id: String(e.id ?? ''),
        name: String(e.name ?? 'Sobre').trim() || 'Sobre',
        allocated: Math.max(0, Number(e.allocated) || 0),
        category: e.category ? String(e.category) : undefined,
        color: e.color,
        createdAt: e.createdAt ?? new Date().toISOString(),
      };
    })
    .filter((e) => e.id);
}

export function normalizeDebts(list: unknown): Debt[] {
  if (!Array.isArray(list)) return [];
  const out: Debt[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue;
    const d = raw as Partial<Debt>;
    const id = String(d.id ?? '');
    if (!id) continue;
    const total = Math.max(0, Number(d.totalAmount) || 0);
    const remaining = Math.max(0, Number(d.remaining ?? total) || 0);
    const kind: DebtKind = d.kind === 'owed_to_me' ? 'owed_to_me' : 'i_owe';
    out.push({
      id,
      name: String(d.name ?? 'Deuda').trim() || 'Deuda',
      kind,
      totalAmount: total,
      remaining,
      installmentAmount:
        d.installmentAmount != null && Number(d.installmentAmount) > 0
          ? Number(d.installmentAmount)
          : undefined,
      dueDay:
        d.dueDay != null
          ? Math.min(31, Math.max(1, Number(d.dueDay) || 1))
          : undefined,
      note: d.note ? String(d.note) : undefined,
      createdAt: d.createdAt ?? new Date().toISOString(),
      updatedAt: d.updatedAt ?? new Date().toISOString(),
    });
  }
  return out;
}

export function normalizeChallenges(list: unknown): SavingsChallenge[] {
  if (!Array.isArray(list)) return [];
  const out: SavingsChallenge[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue;
    const c = raw as Partial<SavingsChallenge>;
    const id = String(c.id ?? '');
    const startDate = String(c.startDate ?? '');
    const endDate = String(c.endDate ?? '');
    if (!id || !startDate || !endDate) continue;
    const type: ChallengeType =
      c.type === 'save_amount' ? 'save_amount' : 'spend_less_week';
    out.push({
      id,
      type,
      title: String(c.title ?? 'Reto').trim() || 'Reto',
      targetAmount: Math.max(0, Number(c.targetAmount) || 0),
      startDate,
      endDate,
      baselineSpend:
        c.baselineSpend != null ? Number(c.baselineSpend) : undefined,
      active: c.active !== false,
      createdAt: c.createdAt ?? new Date().toISOString(),
    });
  }
  return out;
}

export function normalizeAllocation(raw: unknown): AllocationRule {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_ALLOCATION };
  const r = raw as Partial<AllocationRule>;
  const needs = Math.max(0, Number(r.needs) || 0);
  const wants = Math.max(0, Number(r.wants) || 0);
  const savings = Math.max(0, Number(r.savings) || 0);
  const sum = needs + wants + savings;
  if (sum <= 0) return { ...DEFAULT_ALLOCATION };
  return {
    needs: Math.round((needs / sum) * 1000) / 10,
    wants: Math.round((wants / sum) * 1000) / 10,
    savings: Math.round((savings / sum) * 1000) / 10,
  };
}

export function normalizeMembers(list: unknown): HouseholdMember[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((m) => m && typeof m === 'object')
    .map((raw) => {
      const m = raw as Partial<HouseholdMember>;
      return {
        id: String(m.id ?? ''),
        name: String(m.name ?? '').trim() || 'Miembro',
        createdAt: m.createdAt ?? new Date().toISOString(),
      };
    })
    .filter((m) => m.id);
}

export function normalizeFinancePartial(
  parsed: Partial<FinanceState>
): FinanceState {
  return {
    transactions: normalizeTransactions(parsed.transactions),
    goals: Array.isArray(parsed.goals) ? parsed.goals : [],
    chatHistory: Array.isArray(parsed.chatHistory) ? parsed.chatHistory : [],
    cashNow:
      typeof parsed.cashNow === 'number' && Number.isFinite(parsed.cashNow)
        ? parsed.cashNow
        : 0,
    lastSaturdayBonusWeek: parsed.lastSaturdayBonusWeek,
    fixedExpenses: normalizeFixed(parsed.fixedExpenses),
    categoryBudgets: normalizeBudgets(parsed.categoryBudgets),
    envelopes: normalizeEnvelopes(parsed.envelopes),
    debts: normalizeDebts(parsed.debts),
    challenges: normalizeChallenges(parsed.challenges),
    allocationRule: normalizeAllocation(parsed.allocationRule),
    householdMembers: normalizeMembers(parsed.householdMembers),
    dismissedAlertIds: Array.isArray(parsed.dismissedAlertIds)
      ? parsed.dismissedAlertIds.filter((x) => typeof x === 'string')
      : [],
    lastWeeklyReportAt: parsed.lastWeeklyReportAt,
    updatedAt: parsed.updatedAt ?? new Date(0).toISOString(),
  };
}
