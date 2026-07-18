import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';
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

export function isCloudSyncAvailable(): boolean {
  return isFirebaseConfigured();
}

export async function pushToCloud(uid: string, state: FinanceState): Promise<void> {
  if (!isCloudSyncAvailable()) {
    throw new Error('Firebase no configurado');
  }

  const payload: CloudFinanceDoc = {
    transactions: state.transactions,
    goals: state.goals,
    fixedExpenses: state.fixedExpenses,
    cashNow: state.cashNow,
    chatHistory: state.chatHistory,
    lastSaturdayBonusWeek: state.lastSaturdayBonusWeek,
    updatedAt: state.updatedAt || new Date().toISOString(),
    syncedAt: serverTimestamp(),
  };

  await setDoc(userDocRef(uid), payload, { merge: true });
}

export async function pullFromCloud(uid: string): Promise<FinanceState | null> {
  if (!isCloudSyncAvailable()) {
    throw new Error('Firebase no configurado');
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
