import { emptyFinanceState, type FinanceState } from '../types/finance';
import { mergeFinanceStates } from './mergeFinance';

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function withUpdated(at: string, patch: Partial<FinanceState> = {}): FinanceState {
  return { ...emptyFinanceState(), ...patch, updatedAt: at };
}

const older = withUpdated('2026-01-01T00:00:00.000Z', { cashNow: 10 });
const newer = withUpdated('2026-06-01T00:00:00.000Z', { cashNow: 99 });

assertEqual(mergeFinanceStates(older, null).source, 'local-only', 'null remote');
assertEqual(mergeFinanceStates(older, newer).source, 'remote', 'remote wins');
assertEqual(mergeFinanceStates(older, newer).state.cashNow, 99, 'remote cash');
assertEqual(mergeFinanceStates(newer, older).source, 'local', 'local wins');
assertEqual(mergeFinanceStates(newer, older).state.cashNow, 99, 'local cash');

console.log('cloudSync.mergeFinanceStates OK');
