import type { FinanceState } from '../types/finance';

/**
 * Merge seguro por updatedAt: gana el write más reciente.
 * Si empatan o falta timestamp remoto, prioriza local.
 */
export function mergeFinanceStates(
  local: FinanceState,
  remote: FinanceState | null
): { state: FinanceState; source: 'local' | 'remote' | 'local-only' } {
  if (!remote) {
    return { state: local, source: 'local-only' };
  }

  const localTs = Date.parse(local.updatedAt || '') || 0;
  const remoteTs = Date.parse(remote.updatedAt || '') || 0;

  if (remoteTs > localTs) {
    return { state: remote, source: 'remote' };
  }
  return { state: local, source: 'local' };
}
