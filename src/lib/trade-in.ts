import { promises as fs } from "fs";
import path from "path";
import type { TradeInSubmission } from "@/types/trade-in";

const DATA_PATH = path.join(process.cwd(), "data", "trade-ins.json");

export async function readTradeIns(): Promise<TradeInSubmission[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw) as TradeInSubmission[];
  } catch {
    return [];
  }
}

export async function addTradeIn(
  submission: Omit<TradeInSubmission, "id" | "status" | "createdAt">,
): Promise<TradeInSubmission> {
  const existing = await readTradeIns();
  const entry: TradeInSubmission = {
    ...submission,
    id: `trade-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(
    DATA_PATH,
    JSON.stringify([entry, ...existing], null, 2),
    "utf-8",
  );

  return entry;
}
