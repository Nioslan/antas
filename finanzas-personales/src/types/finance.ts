import type { FixedExpense } from './fixed';

export type { FixedExpense };

export type TransactionType = 'inversion' | 'gasto' | 'giro';

export type InversionCategory = 'inversiones' | 'ahorro' | 'otros';

export type GastoCategory =
  | 'comida'
  | 'transporte'
  | 'gasolina'
  | 'vivienda'
  | 'salud'
  | 'ocio'
  | 'personal'
  | 'inversiones'
  | 'otros';

export type GiroCategory =
  | 'salario'
  | 'trabajo'
  | 'freelance'
  | 'ventas'
  | 'otros';

export type Category = InversionCategory | GastoCategory | GiroCategory;

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  /** Opcional: por compatibilidad con datos viejos */
  recovered?: number;
  category: Category;
  note: string;
  date: string; // YYYY-MM-DD
  /** Hora local HH:mm */
  time?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface FinanceState {
  transactions: Transaction[];
  goals: Goal[];
  chatHistory: ChatMessage[];
  /** Dinero actual en mano / bolsillo, editable a voluntad */
  cashNow: number;
  /** Lunes de la semana a la que ya se aplicó el 20% del sábado */
  lastSaturdayBonusWeek?: string;
  fixedExpenses: FixedExpense[];
  /** ISO — último write local o nube (para merge de sync) */
  updatedAt?: string;
}

export interface DaySummary {
  inversion: number;
  gasto: number;
  giro: number;
  recuperado: number;
  ganancia: number;
  /** Libre = ingresos − gastos (− inversiones) */
  libre: number;
}

export interface CapitalSummary {
  invertidoTotal: number;
  recuperadoTotal: number;
  pendiente: number;
  gananciaTotal: number;
  gastoTotal: number;
}
