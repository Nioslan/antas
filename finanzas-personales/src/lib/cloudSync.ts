/**
 * Sync en la nube desactivado: datos solo en el teléfono.
 * No importa Firebase al arrancar (evita peso y fallos de boot).
 */
import { mergeFinanceStates } from './mergeFinance';
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

/** Sync en la nube desactivado: los datos quedan solo en el teléfono. */
export function isCloudSyncAvailable(): boolean {
  return false;
}

export async function pushToCloud(
  _uid: string,
  _state: FinanceState
): Promise<void> {
  throw new Error('Sync en la nube desactivado');
}

export async function pullFromCloud(
  _uid: string
): Promise<FinanceState | null> {
  throw new Error('Sync en la nube desactivado');
}
