import { promises as fs } from "fs";
import path from "path";
import { readOrders } from "@/lib/orders";
import type {
  CreateFinanceEntryInput,
  FinanceEntry,
  FinanceSummary,
} from "@/types/finance";

const DATA_PATH = path.join(process.cwd(), "data", "finance.json");

export async function readFinanceEntries(): Promise<FinanceEntry[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw) as FinanceEntry[];
  } catch {
    return [];
  }
}

async function writeFinanceEntries(entries: FinanceEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(entries, null, 2), "utf-8");
}

export async function getFinanceSummary(): Promise<{
  summary: FinanceSummary;
  entries: FinanceEntry[];
}> {
  const [entries, orders] = await Promise.all([
    readFinanceEntries(),
    readOrders(),
  ]);

  const invested = entries
    .filter((e) => e.type === "investment")
    .reduce((sum, e) => sum + e.amount, 0);

  const expenses = entries
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const extraIncome = entries
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);

  const paidOrders = orders.filter((o) => o.status === "paid");
  const sold = paidOrders.reduce((sum, o) => sum + o.total, 0);

  const profit = sold + extraIncome - invested - expenses;

  return {
    entries,
    summary: {
      invested,
      expenses,
      extraIncome,
      sold,
      salesCount: paidOrders.length,
      profit,
    },
  };
}

export async function addFinanceEntry(
  input: CreateFinanceEntryInput,
): Promise<FinanceEntry> {
  const label = input.label?.trim();
  const amount = Number(input.amount);
  if (!label) throw new Error("Describe el movimiento.");
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("El monto debe ser mayor a 0.");
  }
  if (!["investment", "expense", "income"].includes(input.type)) {
    throw new Error("Tipo de movimiento inválido.");
  }

  const date = input.date ? new Date(input.date) : new Date();
  if (Number.isNaN(date.getTime())) throw new Error("Fecha inválida.");

  const entry: FinanceEntry = {
    id: `fin-${Date.now()}`,
    type: input.type,
    amount: Math.round(amount * 100) / 100,
    label,
    note: input.note?.trim() || undefined,
    date: date.toISOString(),
    createdAt: new Date().toISOString(),
  };

  const entries = await readFinanceEntries();
  await writeFinanceEntries([entry, ...entries]);
  return entry;
}

export async function deleteFinanceEntry(id: string): Promise<boolean> {
  const entries = await readFinanceEntries();
  const next = entries.filter((e) => e.id !== id);
  if (next.length === entries.length) return false;
  await writeFinanceEntries(next);
  return true;
}
