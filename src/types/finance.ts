export type FinanceEntryType = "investment" | "expense" | "income";

export type FinanceEntry = {
  id: string;
  type: FinanceEntryType;
  amount: number;
  label: string;
  note?: string;
  date: string;
  createdAt: string;
};

export type FinanceSummary = {
  invested: number;
  expenses: number;
  extraIncome: number;
  sold: number;
  salesCount: number;
  profit: number;
};

export type CreateFinanceEntryInput = {
  type: FinanceEntryType;
  amount: number;
  label: string;
  note?: string;
  date?: string;
};

export const FINANCE_TYPE_LABELS: Record<FinanceEntryType, string> = {
  investment: "Inversión / costo de equipo",
  expense: "Gasto operativo",
  income: "Ingreso extra",
};
