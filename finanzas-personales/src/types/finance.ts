export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  note: string;
  category: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO
};

export type Goal = {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  createdAt: string;
};

export type FixedExpense = {
  id: string;
  title: string;
  amount: number;
  dayOfMonth: number;
  notify: boolean;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type FinanceState = {
  transactions: Transaction[];
  goals: Goal[];
  fixedExpenses: FixedExpense[];
  cashNow: number;
  chatMessages: ChatMessage[];
  updatedAt: string; // ISO — último write local o nube
};

export const emptyFinanceState = (): FinanceState => ({
  transactions: [],
  goals: [],
  fixedExpenses: [],
  cashNow: 0,
  chatMessages: [],
  updatedAt: new Date(0).toISOString(),
});
