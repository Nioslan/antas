import { promises as fs } from "fs";
import path from "path";
import type { AmazonData } from "@/types/amazon";

const DATA_PATH = path.join(process.cwd(), "data", "amazon.json");

const defaultData: AmazonData = { tag: "", builds: [], products: [] };

export async function readAmazon(): Promise<AmazonData> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AmazonData>;
    return {
      tag: parsed.tag ?? "",
      builds: parsed.builds ?? [],
      products: parsed.products ?? [],
    };
  } catch {
    await writeAmazon(defaultData);
    return defaultData;
  }
}

export async function writeAmazon(data: AmazonData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Agrega el tag de afiliado a un link de Amazon.
 * Si el link ya trae tag, se respeta. Si no hay tag configurado,
 * devuelve el link tal cual.
 */
export function affiliateUrl(url: string, tag: string): string {
  const clean = (url ?? "").trim();
  if (!clean) return "#";
  const t = (tag ?? "").trim();
  if (!t) return clean;
  try {
    const u = new URL(clean);
    if (u.searchParams.has("tag")) return clean;
    u.searchParams.set("tag", t);
    return u.toString();
  } catch {
    // URL relativa o inválida: agregar el tag de forma simple
    const sep = clean.includes("?") ? "&" : "?";
    return `${clean}${sep}tag=${encodeURIComponent(t)}`;
  }
}

export const AMAZON_DISCLOSURE =
  "Como afiliado de Amazon, ANTASPC puede ganar una comisión por las compras que califiquen, sin costo adicional para ti.";
