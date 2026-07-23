import type { GastoCategory } from './finance';

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  /** Día del mes en que suele vencer/pagarse (1–31) */
  dueDay: number;
  /** Id de categoría de gasto (builtin o custom) */
  category: string;
  enabled: boolean;
  /** Última vez que se detectó o marcó como pagado */
  lastPaidDate?: string;
  /** Historial de días del mes en que se pagó (para aprender) */
  learnedDays: number[];
  createdAt: string;
  updatedAt: string;
}

export const FIXED_PRESETS: {
  name: string;
  category: GastoCategory;
  dueDay: number;
}[] = [
  { name: 'Renta', category: 'vivienda', dueDay: 1 },
  { name: 'Agua', category: 'vivienda', dueDay: 10 },
  { name: 'Luz', category: 'vivienda', dueDay: 15 },
  { name: 'Internet', category: 'vivienda', dueDay: 5 },
  { name: 'Gas', category: 'vivienda', dueDay: 12 },
  { name: 'Teléfono', category: 'personal', dueDay: 20 },
];
