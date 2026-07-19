import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { mergeFinanceStates } from './mergeFinance';
import { emptyState } from './storage';
import type { FinanceState } from '../types/finance';

export { mergeFinanceStates };

export type CloudFinanceDoc = {
  transactions: FinanceState['transactions'];
  goals: FinanceState['goals'];
  fixedExpenses: FinanceState['fixedExpenses'];
  cashNow: number;
  chatHistory: FinanceState['chatHistory'];
  lastSaturdayBonusWeek?: string;
  updatedAt: string;
  syncedAt?: unknown;
};

function userDocRef(uid: string) {
  return doc(getFirebaseDb(), 'users', uid);
}

/** Sync en la nube desactivado: los datos quedan solo en el teléfono. */
export function isCloudSyncAvailable(): boolean {
  return false;
}

/** Firestore rechaza `undefined`; hay que omitir esos campos. */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  if (value && typeof value === 'object') {
    // serverTimestamp() y similares se dejan tal cual
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      return value;
    }
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (nested === undefined) continue;
      out[key] = stripUndefined(nested);
    }
    return out as T;
  }
  return value;
}

export async function pushToCloud(uid: string, state: FinanceState): Promise<void> {
  if (!isCloudSyncAvailable()) {
    throw new Error('Sync en la nube desactivado');
  }

  const payload = stripUndefined({
    transactions: state.transactions,
    goals: state.goals,
    fixedExpenses: state.fixedExpenses,
    cashNow: state.cashNow,
    chatHistory: state.chatHistory,
    ...(state.lastSaturdayBonusWeek
      ? { lastSaturdayBonusWeek: state.lastSaturdayBonusWeek }
      : {}),
    updatedAt: state.updatedAt || new Date().toISOString(),
    syncedAt: serverTimestamp(),
  } satisfies CloudFinanceDoc);

  await setDoc(userDocRef(uid), payload, { merge: true });
}

export async function pullFromCloud(uid: string): Promise<FinanceState | null> {
  if (!isCloudSyncAvailable()) {
    throw new Error('Sync en la nube desactivado');
  }

  const snap = await getDoc(userDocRef(uid));
  if (!snap.exists()) return null;

  const data = snap.data() as Partial<CloudFinanceDoc>;
  return {
    ...emptyState,
    transactions: data.transactions ?? [],
    goals: data.goals ?? [],
    fixedExpenses: data.fixedExpenses ?? [],
    cashNow: typeof data.cashNow === 'number' ? data.cashNow : 0,
    chatHistory: data.chatHistory ?? [],
    lastSaturdayBonusWeek: data.lastSaturdayBonusWeek,
    updatedAt: data.updatedAt ?? new Date(0).toISOString(),
  };
}
