import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { FinanceState } from '../types/finance';
import type { FixedExpense } from '../types/fixed';

const DATA_KEY = 'finanzas:taller:v1';
/** SecureStore en Android solo permite [A-Za-z0-9._-]. El nombre viejo con ":" fallaba. */
const API_KEY = 'finanzas_openai_key';
const API_KEY_LEGACY = 'finanzas:openai_key';

export const emptyState: FinanceState = {
  transactions: [],
  goals: [],
  chatHistory: [],
  cashNow: 0,
  fixedExpenses: [],
  categoryBudgets: {},
  updatedAt: new Date(0).toISOString(),
};

function normalizeBudgets(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(value);
    if (!key || !Number.isFinite(n) || n <= 0) continue;
    out[key] = Math.round(n * 100) / 100;
  }
  return out;
}

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
      categoryBudgets: normalizeBudgets(parsed.categoryBudgets),
      updatedAt: parsed.updatedAt ?? new Date(0).toISOString(),
    };
  } catch {
    return emptyState;
  }
}

export async function saveFinanceState(state: FinanceState): Promise<void> {
  await AsyncStorage.setItem(DATA_KEY, JSON.stringify(state));
}

/** Parsea un backup JSON (exportado desde Ajustes). */
export function parseFinanceStateJson(raw: string): FinanceState {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('El respaldo está vacío.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('Ese texto no es un JSON válido.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('El respaldo no tiene el formato de la app.');
  }
  const data = parsed as Partial<FinanceState>;
  if (!Array.isArray(data.transactions) && !Array.isArray(data.goals) && !Array.isArray(data.fixedExpenses)) {
    throw new Error(
      'No parece un respaldo de Finanzas Personales (faltan movimientos/metas/fijos).'
    );
  }
  return {
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    goals: Array.isArray(data.goals) ? data.goals : [],
    chatHistory: Array.isArray(data.chatHistory) ? data.chatHistory : [],
    cashNow:
      typeof data.cashNow === 'number' && Number.isFinite(data.cashNow)
        ? data.cashNow
        : 0,
    lastSaturdayBonusWeek: data.lastSaturdayBonusWeek,
    fixedExpenses: normalizeFixed(data.fixedExpenses),
    categoryBudgets: normalizeBudgets(data.categoryBudgets),
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
}

async function useSecureStore(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function getOpenAiKey(): Promise<string | null> {
  try {
    if (await useSecureStore()) {
      const modern = await SecureStore.getItemAsync(API_KEY);
      if (modern) return modern;
      // Migrar clave vieja si existía (puede fallar por el ":" en Android)
      try {
        const legacy = await SecureStore.getItemAsync(API_KEY_LEGACY);
        if (legacy) {
          await SecureStore.setItemAsync(API_KEY, legacy);
          try {
            await SecureStore.deleteItemAsync(API_KEY_LEGACY);
          } catch {
            // ignore
          }
          return legacy;
        }
      } catch {
        // ignore legacy read errors
      }
    }
    return (
      (await AsyncStorage.getItem(API_KEY)) ??
      (await AsyncStorage.getItem(API_KEY_LEGACY))
    );
  } catch {
    try {
      return await AsyncStorage.getItem(API_KEY);
    } catch {
      return null;
    }
  }
}

export async function setOpenAiKey(key: string): Promise<void> {
  const cleaned = key
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, '')
    .replace(/^Bearer/i, '');

  const secure = await useSecureStore();

  if (!cleaned) {
    if (secure) {
      try {
        await SecureStore.deleteItemAsync(API_KEY);
      } catch {
        // ignore
      }
    }
    await AsyncStorage.removeItem(API_KEY);
    await AsyncStorage.removeItem(API_KEY_LEGACY);
    return;
  }

  // Siempre guardar en AsyncStorage como respaldo (web + si SecureStore falla)
  await AsyncStorage.setItem(API_KEY, cleaned);

  if (secure) {
    try {
      await SecureStore.setItemAsync(API_KEY, cleaned);
    } catch (err) {
      // No tumbar el guardado: AsyncStorage ya tiene la clave
      console.warn('SecureStore setOpenAiKey failed, using AsyncStorage', err);
    }
  }
}
