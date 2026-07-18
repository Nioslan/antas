import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { getFirebaseDb, isFirebaseConfigured } from '@/src/lib/firebase';
import { mergeFinanceStates } from '@/src/lib/mergeFinance';
import type { FinanceState } from '@/src/types/finance';
import { emptyFinanceState } from '@/src/types/finance';

export { mergeFinanceStates };

export type CloudFinanceDoc = {
  transactions: FinanceState['transactions'];
  goals: FinanceState['goals'];
  fixedExpenses: FinanceState['fixedExpenses'];
  cashNow: number;
  chatMessages: FinanceState['chatMessages'];
  updatedAt: string;
  syncedAt?: unknown;
};

function userDocRef(uid: string) {
  return doc(getFirebaseDb(), 'users', uid);
}

export function isCloudSyncAvailable(): boolean {
  return isFirebaseConfigured();
}

/** Sube el estado completo del usuario a Firestore. */
export async function pushToCloud(uid: string, state: FinanceState): Promise<void> {
  if (!isCloudSyncAvailable()) {
    throw new Error('Firebase no configurado');
  }

  const payload: CloudFinanceDoc = {
    transactions: state.transactions,
    goals: state.goals,
    fixedExpenses: state.fixedExpenses,
    cashNow: state.cashNow,
    chatMessages: state.chatMessages,
    updatedAt: state.updatedAt || new Date().toISOString(),
    syncedAt: serverTimestamp(),
  };

  await setDoc(userDocRef(uid), payload, { merge: true });
}

/** Baja el estado desde Firestore. null si no hay documento. */
export async function pullFromCloud(uid: string): Promise<FinanceState | null> {
  if (!isCloudSyncAvailable()) {
    throw new Error('Firebase no configurado');
  }

  const snap = await getDoc(userDocRef(uid));
  if (!snap.exists()) return null;

  const data = snap.data() as Partial<CloudFinanceDoc>;
  return {
    ...emptyFinanceState(),
    transactions: data.transactions ?? [],
    goals: data.goals ?? [],
    fixedExpenses: data.fixedExpenses ?? [],
    cashNow: typeof data.cashNow === 'number' ? data.cashNow : 0,
    chatMessages: data.chatMessages ?? [],
    updatedAt: data.updatedAt ?? new Date(0).toISOString(),
  };
}
