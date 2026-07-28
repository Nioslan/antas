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

export type Category = string;

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
  /** Foto del ticket (data URI o file uri local) */
  receiptUri?: string;
  /** Miembro del hogar (modo local) */
  memberId?: string;
  /** Sobre al que se imputa el gasto */
  envelopeId?: string;
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

/** Sobre / plata asignada del mes */
export interface Envelope {
  id: string;
  name: string;
  /** Tope asignado este mes */
  allocated: number;
  /** Categoría de gasto opcional para auto-imputar */
  category?: string;
  color?: string;
  createdAt: string;
}

export type DebtKind = 'i_owe' | 'owed_to_me';

export interface Debt {
  id: string;
  name: string;
  kind: DebtKind;
  /** Saldo total original */
  totalAmount: number;
  /** Lo que falta pagar / cobrar */
  remaining: number;
  /** Cuota sugerida (opcional) */
  installmentAmount?: number;
  /** Día del mes de vencimiento (1–31) */
  dueDay?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export type ChallengeType = 'spend_less_week' | 'save_amount';

export interface SavingsChallenge {
  id: string;
  type: ChallengeType;
  title: string;
  /** Meta de ahorro (save_amount) o tope de gasto semanal (spend_less) */
  targetAmount: number;
  startDate: string;
  endDate: string;
  /** Gasto de la semana base (para spend_less) */
  baselineSpend?: number;
  active: boolean;
  createdAt: string;
}

/** Regla de % necesidades / gustos / ahorro */
export interface AllocationRule {
  needs: number;
  wants: number;
  savings: number;
}

export interface HouseholdMember {
  id: string;
  name: string;
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
  /**
   * Tope mensual por categoría de gasto (id → monto).
   * Ej: { comida: 200, ocio: 80 }
   */
  categoryBudgets?: Record<string, number>;
  envelopes?: Envelope[];
  debts?: Debt[];
  challenges?: SavingsChallenge[];
  /** Default 50/30/20 */
  allocationRule?: AllocationRule;
  householdMembers?: HouseholdMember[];
  /** IDs de alertas descartadas (día:id) */
  dismissedAlertIds?: string[];
  /** ISO del último informe semanal generado */
  lastWeeklyReportAt?: string;
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

export const DEFAULT_ALLOCATION: AllocationRule = {
  needs: 50,
  wants: 30,
  savings: 20,
};
