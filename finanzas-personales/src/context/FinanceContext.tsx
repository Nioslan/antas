import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { askFinanceCoach } from '../lib/ai';
import {
  isCloudSyncAvailable,
  mergeFinanceStates,
  pullFromCloud,
  pushToCloud,
} from '../lib/cloudSync';
import { learnFromTransaction } from '../lib/fixedExpenses';
import { scheduleFixedReminders } from '../lib/notifications';
import { applySaturdayBonusIfDue } from '../lib/saturdayBonus';
import { emptyState, loadFinanceState, saveFinanceState } from '../lib/storage';
import { summarizeCapital, summarizeDay } from '../lib/summary';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import type {
  CapitalSummary,
  Category,
  ChatMessage,
  DaySummary,
  FinanceState,
  GastoCategory,
  Goal,
  Transaction,
  TransactionType,
} from '../types/finance';
import type { FixedExpense } from '../types/fixed';

const SYNC_DEBOUNCE_MS = 900;

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

interface FinanceContextValue {
  ready: boolean;
  state: FinanceState;
  today: DaySummary;
  capital: CapitalSummary;
  cashNow: number;
  adjustCashNow: (delta: number) => void;
  setCashNow: (amount: number) => void;
  addTransaction: (input: {
    type: TransactionType;
    amount: number;
    category: Category;
    note?: string;
    date?: string;
    time?: string;
    recovered?: number;
  }) => void;
  removeTransaction: (id: string) => void;
  addGoal: (input: {
    name: string;
    targetAmount: number;
    currentAmount?: number;
    deadline?: string;
  }) => void;
  contributeToGoal: (id: string, amount: number) => void;
  removeGoal: (id: string) => void;
  addFixedExpense: (input: {
    name: string;
    amount: number;
    dueDay: number;
    category: GastoCategory;
  }) => void;
  updateFixedExpense: (
    id: string,
    patch: Partial<
      Pick<
        FixedExpense,
        'name' | 'amount' | 'dueDay' | 'category' | 'enabled' | 'lastPaidDate'
      >
    >
  ) => void;
  removeFixedExpense: (id: string) => void;
  /** Paga el fijo: suma un gasto y deja el botón en Pagado por 5 días */
  payFixedExpense: (id: string) => boolean;
  markFixedPaid: (id: string, date?: string) => void;
  refreshFixedReminders: () => Promise<void>;
  sendChat: (message: string) => Promise<void>;
  clearChat: () => void;
  resetAllData: () => Promise<void>;
  exportDataJson: () => string;
  chatting: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: string | null;
  syncNow: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { settings, ready: settingsReady } = useSettings();
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<FinanceState>({
    transactions: [],
    goals: [],
    chatHistory: [],
    cashNow: 0,
    fixedExpenses: [],
    updatedAt: new Date(0).toISOString(),
  });
  const [chatting, setChatting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  const stateRef = useRef(state);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncingRef = useRef(false);
  const skipPushRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // No usamos @react-native-community/netinfo: ese módulo nativo no está
  // en el APK instalado y rompía la app en negro vía OTA. Detectamos offline
  // por errores de red al sincronizar.
  useEffect(() => {
    setOnline(true);
  }, []);

  const pushDebounced = useCallback(
    (next: FinanceState) => {
      if (!user || !isCloudSyncAvailable()) return;
      if (skipPushRef.current) {
        skipPushRef.current = false;
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
          setSyncError(
            err instanceof Error ? err.message : 'Error al sincronizar'
          );
        } finally {
          syncingRef.current = false;
        }
      }, SYNC_DEBOUNCE_MS);
    },
    [online, user]
  );

  const syncNow = useCallback(async () => {
    if (!user || !isCloudSyncAvailable()) {
      setSyncError('Iniciá sesión para sincronizar con la nube.');
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
      const { state: merged, source } = mergeFinanceStates(
        stateRef.current,
        remote
      );
      skipPushRef.current = true;
      setState(merged);
      await saveFinanceState(merged);
      if (source === 'local' || source === 'local-only') {
        await pushToCloud(user.uid, merged);
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
  }, [online, user]);

  useEffect(() => {
    if (!settingsReady) return;
    loadFinanceState().then((loaded) => {
      const { state: withBonus } = settings.saturdayBonusEnabled
        ? applySaturdayBonusIfDue(loaded)
        : { state: loaded };
      setState(withBonus);
      setReady(true);
      if (settings.notificationsEnabled) {
        void scheduleFixedReminders(withBonus.fixedExpenses);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsReady]);

  useEffect(() => {
    if (!ready || !settings.saturdayBonusEnabled) return;
    const { state: next, applied } = applySaturdayBonusIfDue(state);
    if (applied) setState(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ready,
    settings.saturdayBonusEnabled,
    state.transactions,
    state.lastSaturdayBonusWeek,
  ]);

  useEffect(() => {
    if (!ready) return;
    const stamped: FinanceState = skipPushRef.current
      ? state
      : { ...state, updatedAt: new Date().toISOString() };
    void saveFinanceState(stamped);
    stateRef.current = stamped;
    pushDebounced(stamped);
  }, [state, ready, pushDebounced]);

  // Al iniciar sesión: pull + merge
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
        const { state: merged, source } = mergeFinanceStates(
          stateRef.current,
          remote
        );
        skipPushRef.current = true;
        setState(merged);
        await saveFinanceState(merged);
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
          setSyncError(
            err instanceof Error ? err.message : 'Error al sincronizar'
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [online, ready, user?.uid]);

  useEffect(() => {
    if (!ready || !user || !online) return;
    if (syncStatus === 'offline') {
      void syncNow();
    }
  }, [online, ready, syncNow, syncStatus, user]);

  useEffect(() => {
    if (!ready || !settings.notificationsEnabled) return;
    void scheduleFixedReminders(state.fixedExpenses);
  }, [ready, settings.notificationsEnabled, state.fixedExpenses]);

  const today = useMemo(
    () => summarizeDay(state.transactions),
    [state.transactions]
  );

  const capital = useMemo(
    () => summarizeCapital(state.transactions),
    [state.transactions]
  );

  const addTransaction = useCallback(
    (input: {
      type: TransactionType;
      amount: number;
      category: Category;
      note?: string;
      date?: string;
      time?: string;
      recovered?: number;
    }) => {
      const amount = Math.abs(input.amount);
      const now = new Date();
      const date =
        input.date ??
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const time =
        input.time ??
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const [hh, mm] = time.split(':').map(Number);
      const [y, m, d] = date.split('-').map(Number);
      const stamped = new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);

      const tx: Transaction = {
        id: uid('tx'),
        type: input.type,
        amount,
        category: input.category,
        note: input.note?.trim() ?? '',
        date,
        time,
        createdAt: stamped.toISOString(),
        recovered:
          input.type === 'giro' && input.recovered != null
            ? Math.min(Math.max(input.recovered, 0), amount)
            : undefined,
      };
      setState((prev) => ({
        ...prev,
        transactions: [tx, ...prev.transactions],
        fixedExpenses: learnFromTransaction(prev.fixedExpenses, tx),
      }));
    },
    []
  );

  const removeTransaction = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  }, []);

  const addGoal = useCallback(
    (input: {
      name: string;
      targetAmount: number;
      currentAmount?: number;
      deadline?: string;
    }) => {
      const goal: Goal = {
        id: uid('goal'),
        name: input.name.trim(),
        targetAmount: Math.abs(input.targetAmount),
        currentAmount: Math.abs(input.currentAmount ?? 0),
        deadline: input.deadline || undefined,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({ ...prev, goals: [goal, ...prev.goals] }));
    },
    []
  );

  const contributeToGoal = useCallback((id: string, amount: number) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === id
          ? {
              ...g,
              currentAmount: Math.min(
                g.targetAmount,
                g.currentAmount + Math.abs(amount)
              ),
            }
          : g
      ),
    }));
  }, []);

  const removeGoal = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  }, []);

  const addFixedExpense = useCallback(
    (input: {
      name: string;
      amount: number;
      dueDay: number;
      category: GastoCategory;
    }) => {
      const now = new Date().toISOString();
      const item: FixedExpense = {
        id: uid('fix'),
        name: input.name.trim(),
        amount: Math.abs(input.amount),
        dueDay: Math.min(31, Math.max(1, Math.round(input.dueDay))),
        category: input.category,
        enabled: true,
        learnedDays: [Math.min(31, Math.max(1, Math.round(input.dueDay)))],
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({
        ...prev,
        fixedExpenses: [item, ...prev.fixedExpenses],
      }));
    },
    []
  );

  const updateFixedExpense = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          FixedExpense,
          'name' | 'amount' | 'dueDay' | 'category' | 'enabled' | 'lastPaidDate'
        >
      >
    ) => {
      setState((prev) => ({
        ...prev,
        fixedExpenses: prev.fixedExpenses.map((f) =>
          f.id === id
            ? {
                ...f,
                ...patch,
                dueDay:
                  patch.dueDay != null
                    ? Math.min(31, Math.max(1, Math.round(patch.dueDay)))
                    : f.dueDay,
                amount:
                  patch.amount != null ? Math.abs(patch.amount) : f.amount,
                updatedAt: new Date().toISOString(),
              }
            : f
        ),
      }));
    },
    []
  );

  const removeFixedExpense = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.filter((f) => f.id !== id),
    }));
  }, []);

  const payFixedExpense = useCallback((id: string): boolean => {
    const bill = state.fixedExpenses.find((f) => f.id === id);
    if (!bill) return false;

    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (bill.lastPaidDate) {
      const [y1, m1, d1] = date.split('-').map(Number);
      const [y2, m2, d2] = bill.lastPaidDate.split('-').map(Number);
      const elapsed = Math.round(
        (new Date(y1, m1 - 1, d1).getTime() -
          new Date(y2, m2 - 1, d2).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (elapsed >= 0 && elapsed < 5) return false;
    }

    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const day = Number(date.slice(8, 10));

    setState((prev) => {
      const current = prev.fixedExpenses.find((f) => f.id === id);
      if (!current) return prev;

      const learnedDays = [...current.learnedDays, day].slice(-8);
      const sorted = [...learnedDays].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const dueDay =
        sorted.length % 2 === 0
          ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
          : sorted[mid];

      const tx: Transaction = {
        id: uid('tx'),
        type: 'gasto',
        amount: current.amount,
        category: current.category,
        note: current.name,
        date,
        time,
        createdAt: now.toISOString(),
      };

      return {
        ...prev,
        transactions: [tx, ...prev.transactions],
        fixedExpenses: prev.fixedExpenses.map((f) =>
          f.id === id
            ? {
                ...f,
                lastPaidDate: date,
                learnedDays,
                dueDay,
                updatedAt: now.toISOString(),
              }
            : f
        ),
      };
    });

    return true;
  }, [state.fixedExpenses]);

  const markFixedPaid = useCallback((id: string, date?: string) => {
    const paid =
      date ??
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    const day = Number(paid.slice(8, 10));
    setState((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.map((f) => {
        if (f.id !== id) return f;
        const learnedDays = [...f.learnedDays, day].slice(-8);
        const sorted = [...learnedDays].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const dueDay =
          sorted.length % 2 === 0
            ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
            : sorted[mid];
        return {
          ...f,
          lastPaidDate: paid,
          learnedDays,
          dueDay,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const refreshFixedReminders = useCallback(async () => {
    await scheduleFixedReminders(state.fixedExpenses);
  }, [state.fixedExpenses]);

  const sendChat = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || chatting) return;

      const userMsg: ChatMessage = {
        id: uid('msg'),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        chatHistory: [...prev.chatHistory, userMsg],
      }));
      setChatting(true);

      try {
        const snapshot = {
          ...state,
          chatHistory: [...state.chatHistory, userMsg],
        };
        const { reply } = await askFinanceCoach(snapshot, trimmed);
        const assistantMsg: ChatMessage = {
          id: uid('msg'),
          role: 'assistant',
          content: reply,
          createdAt: new Date().toISOString(),
        };
        setState((prev) => ({
          ...prev,
          chatHistory: [...prev.chatHistory, assistantMsg],
        }));
      } finally {
        setChatting(false);
      }
    },
    [chatting, state]
  );

  const clearChat = useCallback(() => {
    setState((prev) => ({ ...prev, chatHistory: [] }));
  }, []);

  const resetAllData = useCallback(async () => {
    setState(emptyState);
    await saveFinanceState(emptyState);
  }, []);

  const exportDataJson = useCallback(() => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const adjustCashNow = useCallback((delta: number) => {
    if (!Number.isFinite(delta) || delta === 0) return;
    setState((prev) => ({
      ...prev,
      cashNow: Math.round((prev.cashNow + delta) * 100) / 100,
    }));
  }, []);

  const setCashNow = useCallback((amount: number) => {
    if (!Number.isFinite(amount)) return;
    setState((prev) => ({
      ...prev,
      cashNow: Math.round(amount * 100) / 100,
    }));
  }, []);

  const value: FinanceContextValue = {
    ready,
    state,
    today,
    capital,
    cashNow: state.cashNow,
    adjustCashNow,
    setCashNow,
    addTransaction,
    removeTransaction,
    addGoal,
    contributeToGoal,
    removeGoal,
    addFixedExpense,
    updateFixedExpense,
    removeFixedExpense,
    payFixedExpense,
    markFixedPaid,
    refreshFixedReminders,
    sendChat,
    clearChat,
    resetAllData,
    exportDataJson,
    chatting,
    syncStatus,
    syncError,
    lastSyncedAt,
    syncNow,
  };

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance debe usarse dentro de FinanceProvider');
  return ctx;
}
