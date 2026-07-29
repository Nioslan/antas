import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FinanceState } from '../types/finance';
import { DEFAULT_ALLOCATION } from '../types/finance';
import { normalizeFinancePartial } from './normalizeFinance';

const DATA_KEY = 'finanzas:finance:v1';
const DATA_KEY_LEGACY = 'antas:finance:v1';
const API_KEY = 'finanzas_openai_key';
const API_KEY_LEGACY = ['antas_openai_key', 'antas_openai_key_legacy'];

export const emptyState: FinanceState = {
  transactions: [],
  goals: [],
  chatHistory: [],
  cashNow: 0,
  fixedExpenses: [],
  categoryBudgets: {},
  envelopes: [],
  debts: [],
  challenges: [],
  allocationRule: { ...DEFAULT_ALLOCATION },
  householdMembers: [],
  dismissedAlertIds: [],
  updatedAt: new Date(0).toISOString(),
};

export async function loadFinanceState(): Promise<FinanceState> {
  try {
    const raw =
      (await AsyncStorage.getItem(DATA_KEY)) ??
      (await AsyncStorage.getItem(DATA_KEY_LEGACY));
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<FinanceState>;
    return normalizeFinancePartial(parsed);
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
  if (
    !Array.isArray(data.transactions) &&
    !Array.isArray(data.goals) &&
    !Array.isArray(data.fixedExpenses)
  ) {
    throw new Error(
      'No parece un respaldo de Finanzas Personales (faltan movimientos/metas/fijos).'
    );
  }
  return normalizeFinancePartial({
    ...data,
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  });
}

export async function getOpenAiKey(): Promise<string | null> {
  try {
    const modern = await AsyncStorage.getItem(API_KEY);
    if (modern) return modern;
    for (const legacy of API_KEY_LEGACY) {
      const value = await AsyncStorage.getItem(legacy);
      if (value) {
        await AsyncStorage.setItem(API_KEY, value);
        return value;
      }
    }
    return null;
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
    await AsyncStorage.removeItem(API_KEY);
    for (const legacy of API_KEY_LEGACY) {
      await AsyncStorage.removeItem(legacy);
    }
    return;
  }

  await AsyncStorage.setItem(API_KEY, cleaned);
}
