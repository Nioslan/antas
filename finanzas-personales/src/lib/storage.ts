import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { FinanceState } from '../types/finance';
import type { FixedExpense } from '../types/fixed';

const DATA_KEY = 'finanzas:taller:v1';
const API_KEY = 'finanzas:openai_key';

export const emptyState: FinanceState = {
  transactions: [],
  goals: [],
  chatHistory: [],
  cashNow: 0,
  fixedExpenses: [],
  updatedAt: new Date(0).toISOString(),
};

function normalizeFixed(list: unknown): FixedExpense[] {
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

export async function loadFinanceState(): Promise<FinanceState> {
  try {
    const raw = await AsyncStorage.getItem(DATA_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<FinanceState>;
    return {
      transactions: parsed.transactions ?? [],
      goals: parsed.goals ?? [],
      chatHistory: parsed.chatHistory ?? [],
      cashNow:
        typeof parsed.cashNow === 'number' && Number.isFinite(parsed.cashNow)
          ? parsed.cashNow
          : 0,
      lastSaturdayBonusWeek: parsed.lastSaturdayBonusWeek,
      fixedExpenses: normalizeFixed(parsed.fixedExpenses),
      updatedAt: parsed.updatedAt ?? new Date(0).toISOString(),
    };
  } catch {
    return emptyState;
  }
}

export async function saveFinanceState(state: FinanceState): Promise<void> {
  await AsyncStorage.setItem(DATA_KEY, JSON.stringify(state));
}

export async function getOpenAiKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(API_KEY);
  } catch {
    return null;
  }
}

export async function setOpenAiKey(key: string): Promise<void> {
  const cleaned = key
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, '')
    .replace(/^Bearer/i, '');
  if (!cleaned) {
    await SecureStore.deleteItemAsync(API_KEY);
    return;
  }
  await SecureStore.setItemAsync(API_KEY, cleaned);
}
