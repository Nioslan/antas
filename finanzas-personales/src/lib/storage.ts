import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { FinanceState } from '../types/finance';
import { DEFAULT_ALLOCATION } from '../types/finance';
import { normalizeFinancePartial } from './normalizeFinance';

const DATA_KEY = 'finanzas:taller:v1';
/** SecureStore en Android solo permite [A-Za-z0-9._-]. El nombre viejo con ":" fallaba. */
const API_KEY = 'finanzas_openai_key';
const API_KEY_LEGACY = 'finanzas:openai_key';

type SecureStoreModule = typeof import('expo-secure-store');

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
    const raw = await AsyncStorage.getItem(DATA_KEY);
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

async function getSecureStore(): Promise<SecureStoreModule | null> {
  if (Platform.OS === 'web') return null;
  try {
    const SecureStore = await import('expo-secure-store');
    const ok = await SecureStore.isAvailableAsync();
    return ok ? SecureStore : null;
  } catch {
    return null;
  }
}

export async function getOpenAiKey(): Promise<string | null> {
  try {
    const SecureStore = await getSecureStore();
    if (SecureStore) {
      const modern = await SecureStore.getItemAsync(API_KEY);
      if (modern) return modern;
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

  const SecureStore = await getSecureStore();

  if (!cleaned) {
    if (SecureStore) {
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

  await AsyncStorage.setItem(API_KEY, cleaned);

  if (SecureStore) {
    try {
      await SecureStore.setItemAsync(API_KEY, cleaned);
    } catch (err) {
      console.warn('SecureStore setOpenAiKey failed, using AsyncStorage', err);
    }
  }
}
