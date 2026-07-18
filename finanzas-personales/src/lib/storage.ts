import AsyncStorage from '@react-native-async-storage/async-storage';

import { emptyFinanceState, type FinanceState } from '@/src/types/finance';

export const FINANCE_STORAGE_KEY = 'finanzas:taller:v1';

export async function loadFinanceState(): Promise<FinanceState> {
  try {
    const raw = await AsyncStorage.getItem(FINANCE_STORAGE_KEY);
    if (!raw) return emptyFinanceState();
    const parsed = JSON.parse(raw) as Partial<FinanceState>;
    return {
      ...emptyFinanceState(),
      ...parsed,
      transactions: parsed.transactions ?? [],
      goals: parsed.goals ?? [],
      fixedExpenses: parsed.fixedExpenses ?? [],
      chatMessages: parsed.chatMessages ?? [],
      cashNow: typeof parsed.cashNow === 'number' ? parsed.cashNow : 0,
      updatedAt: parsed.updatedAt ?? new Date(0).toISOString(),
    };
  } catch {
    return emptyFinanceState();
  }
}

export async function saveFinanceState(state: FinanceState): Promise<void> {
  await AsyncStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(state));
}

export async function clearFinanceState(): Promise<void> {
  await AsyncStorage.removeItem(FINANCE_STORAGE_KEY);
}
