import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import NetInfo from '@react-native-community/netinfo';

import { useAuth } from '@/src/context/AuthContext';
import {
  pullFromCloud,
  pushToCloud,
  isCloudSyncAvailable,
} from '@/src/lib/cloudSync';
import { mergeFinanceStates } from '@/src/lib/mergeFinance';
import { loadFinanceState, saveFinanceState } from '@/src/lib/storage';
import {
  emptyFinanceState,
  type ChatMessage,
  type FinanceState,
  type FixedExpense,
  type Goal,
  type Transaction,
} from '@/src/types/finance';

const SYNC_DEBOUNCE_MS = 900;

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

type FinanceContextValue = {
  ready: boolean;
  state: FinanceState;
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: string | null;
  setCashNow: (amount: number) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  removeTransaction: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'savedAmount'> & { savedAmount?: number }) => void;
  updateGoalSaved: (id: string, savedAmount: number) => void;
  removeGoal: (id: string) => void;
  addFixedExpense: (item: Omit<FixedExpense, 'id' | 'createdAt'>) => void;
  removeFixedExpense: (id: string) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  syncNow: () => Promise<void>;
  replaceState: (next: FinanceState) => Promise<void>;
  clearAllLocal: () => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<FinanceState>(emptyFinanceState);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  const stateRef = useRef(state);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncingRef = useRef(false);
  const skipNextPushRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((info) => {
      const isOnline = Boolean(info.isConnected && info.isInternetReachable !== false);
      setOnline(isOnline);
      if (!isOnline) setSyncStatus('offline');
    });
    return () => unsub();
  }, []);

  const persistLocal = useCallback(async (next: FinanceState) => {
    await saveFinanceState(next);
  }, []);

  const pushDebounced = useCallback(
    (next: FinanceState) => {
      if (!user || !isCloudSyncAvailable()) return;
      if (skipNextPushRef.current) {
        skipNextPushRef.current = false;
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        if (!online) {
          setSyncStatus('offline');
          return;
        }
        if (syncingRef.current) return;
        syncingRef.current = true;
        setSyncStatus('syncing');
        try {
          await pushToCloud(user.uid, next);
          setLastSyncedAt(new Date().toISOString());
          setSyncStatus('synced');
          setSyncError(null);
        } catch (err) {
          setSyncStatus('error');
          setSyncError(err instanceof Error ? err.message : 'Error al sincronizar');
        } finally {
          syncingRef.current = false;
        }
      }, SYNC_DEBOUNCE_MS);
    },
    [online, user],
  );

  const commit = useCallback(
    (updater: (prev: FinanceState) => FinanceState) => {
      setState((prev) => {
        const base = updater(prev);
        const next: FinanceState = {
          ...base,
          updatedAt: new Date().toISOString(),
        };
        void persistLocal(next);
        pushDebounced(next);
        return next;
      });
    },
    [persistLocal, pushDebounced],
  );

  const syncNow = useCallback(async () => {
    if (!user || !isCloudSyncAvailable()) {
      setSyncError('Iniciá sesión y configurá Firebase para sincronizar.');
      setSyncStatus('error');
      return;
    }
    if (!online) {
      setSyncStatus('offline');
      setSyncError('Sin conexión. Los cambios quedan en este teléfono.');
      return;
    }
    if (syncingRef.current) return;

    syncingRef.current = true;
    setSyncStatus('syncing');
    try {
      const remote = await pullFromCloud(user.uid);
      const local = stateRef.current;
      const { state: merged, source } = mergeFinanceStates(local, remote);

      skipNextPushRef.current = true;
      setState(merged);
      await persistLocal(merged);

      // Si local ganó o no había remoto, empujamos; si remoto ganó, igual
      // empujamos solo si local tenía cambios más nuevos (ya cubierto por merge).
      if (source === 'local' || source === 'local-only') {
        await pushToCloud(user.uid, merged);
      } else if (source === 'remote') {
        // Asegurar que la nube queda como fuente de verdad ya bajada
      }

      setLastSyncedAt(new Date().toISOString());
      setSyncStatus('synced');
      setSyncError(null);
    } catch (err) {
      setSyncStatus('error');
      setSyncError(err instanceof Error ? err.message : 'Error al sincronizar');
    } finally {
      syncingRef.current = false;
    }
  }, [online, persistLocal, user]);

  // Carga inicial local
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = await loadFinanceState();
      if (cancelled) return;
      setState(local);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Al iniciar sesión: pull + merge + push si hace falta
  useEffect(() => {
    if (!ready || !user || !isCloudSyncAvailable()) return;

    let cancelled = false;
    (async () => {
      if (!online) {
        setSyncStatus('offline');
        return;
      }
      setSyncStatus('syncing');
      try {
        const remote = await pullFromCloud(user.uid);
        if (cancelled) return;
        const { state: merged, source } = mergeFinanceStates(stateRef.current, remote);
        skipNextPushRef.current = true;
        setState(merged);
        await persistLocal(merged);

        if (source === 'local' || source === 'local-only') {
          await pushToCloud(user.uid, merged);
        }

        if (!cancelled) {
          setLastSyncedAt(new Date().toISOString());
          setSyncStatus('synced');
          setSyncError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSyncStatus('error');
          setSyncError(err instanceof Error ? err.message : 'Error al sincronizar');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [online, persistLocal, ready, user?.uid]);

  // Al recuperar conexión, sincronizar
  useEffect(() => {
    if (!ready || !user || !online) return;
    if (syncStatus === 'offline') {
      void syncNow();
    }
  }, [online, ready, syncNow, syncStatus, user]);

  const setCashNow = useCallback(
    (amount: number) => {
      commit((prev) => ({ ...prev, cashNow: Math.max(0, amount) }));
    },
    [commit],
  );

  const addTransaction = useCallback(
    (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
      commit((prev) => ({
        ...prev,
        transactions: [
          {
            ...tx,
            id: newId(),
            createdAt: new Date().toISOString(),
          },
          ...prev.transactions,
        ],
      }));
    },
    [commit],
  );

  const removeTransaction = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
      }));
    },
    [commit],
  );

  const addGoal = useCallback(
    (goal: Omit<Goal, 'id' | 'createdAt' | 'savedAmount'> & { savedAmount?: number }) => {
      commit((prev) => ({
        ...prev,
        goals: [
          {
            id: newId(),
            title: goal.title,
            targetAmount: goal.targetAmount,
            savedAmount: goal.savedAmount ?? 0,
            createdAt: new Date().toISOString(),
          },
          ...prev.goals,
        ],
      }));
    },
    [commit],
  );

  const updateGoalSaved = useCallback(
    (id: string, savedAmount: number) => {
      commit((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === id ? { ...g, savedAmount: Math.max(0, savedAmount) } : g,
        ),
      }));
    },
    [commit],
  );

  const removeGoal = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== id),
      }));
    },
    [commit],
  );

  const addFixedExpense = useCallback(
    (item: Omit<FixedExpense, 'id' | 'createdAt'>) => {
      commit((prev) => ({
        ...prev,
        fixedExpenses: [
          {
            ...item,
            id: newId(),
            createdAt: new Date().toISOString(),
          },
          ...prev.fixedExpenses,
        ],
      }));
    },
    [commit],
  );

  const removeFixedExpense = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        fixedExpenses: prev.fixedExpenses.filter((f) => f.id !== id),
      }));
    },
    [commit],
  );

  const setChatMessages = useCallback(
    (messages: ChatMessage[]) => {
      commit((prev) => ({ ...prev, chatMessages: messages }));
    },
    [commit],
  );

  const replaceState = useCallback(
    async (next: FinanceState) => {
      const stamped = { ...next, updatedAt: new Date().toISOString() };
      setState(stamped);
      await persistLocal(stamped);
      pushDebounced(stamped);
    },
    [persistLocal, pushDebounced],
  );

  const clearAllLocal = useCallback(async () => {
    const empty = emptyFinanceState();
    empty.updatedAt = new Date().toISOString();
    setState(empty);
    await persistLocal(empty);
    if (user && isCloudSyncAvailable() && online) {
      try {
        await pushToCloud(user.uid, empty);
      } catch {
        // offline / error: local ya limpio
      }
    }
  }, [online, persistLocal, user]);

  const value = useMemo(
    () => ({
      ready,
      state,
      syncStatus,
      syncError,
      lastSyncedAt,
      setCashNow,
      addTransaction,
      removeTransaction,
      addGoal,
      updateGoalSaved,
      removeGoal,
      addFixedExpense,
      removeFixedExpense,
      setChatMessages,
      syncNow,
      replaceState,
      clearAllLocal,
    }),
    [
      ready,
      state,
      syncStatus,
      syncError,
      lastSyncedAt,
      setCashNow,
      addTransaction,
      removeTransaction,
      addGoal,
      updateGoalSaved,
      removeGoal,
      addFixedExpense,
      removeFixedExpense,
      setChatMessages,
      syncNow,
      replaceState,
      clearAllLocal,
    ],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance debe usarse dentro de FinanceProvider');
  return ctx;
}
