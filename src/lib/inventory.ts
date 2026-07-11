import { promises as fs } from "fs";
import path from "path";
import type {
  InventoryData,
  InventorySettings,
  Product,
  ProductLine,
} from "@/types/inventory";

const DATA_PATH = path.join(process.cwd(), "data", "inventory.json");

const defaultData: InventoryData = {
  settings: {
    logo: "",
    lineImages: { renew: "", hybrid: "", elite: "" },
  },
  products: [],
};

export async function readInventory(): Promise<InventoryData> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw) as InventoryData;
  } catch {
    await writeInventory(defaultData);
    return defaultData;
  }
}

export async function writeInventory(data: InventoryData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function getProducts(): Promise<Product[]> {
  const data = await readInventory();
  return data.products;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.id === id);
}

export async function getSettings(): Promise<InventorySettings> {
  const data = await readInventory();
  return data.settings;
}

export async function addProduct(
  product: Omit<Product, "id" | "createdAt" | "updatedAt">,
): Promise<Product> {
  const data = await readInventory();
  const now = new Date().toISOString();
  const newProduct: Product = {
    ...product,
    id: `prod-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  data.products.unshift(newProduct);
  await writeInventory(data);
  return newProduct;
}

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, "id" | "createdAt">>,
): Promise<Product | null> {
  const data = await readInventory();
  const index = data.products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  data.products[index] = {
    ...data.products[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeInventory(data);
  return data.products[index];
}

export async function deleteProduct(id: string): Promise<boolean> {
  const data = await readInventory();
  const before = data.products.length;
  data.products = data.products.filter((p) => p.id !== id);
  if (data.products.length === before) return false;
  await writeInventory(data);
  return true;
}

export async function updateSettings(
  settings: Partial<InventorySettings>,
): Promise<InventorySettings> {
  const data = await readInventory();
  data.settings = {
    ...data.settings,
    ...settings,
    lineImages: {
      ...data.settings.lineImages,
      ...(settings.lineImages ?? {}),
    },
  };
  await writeInventory(data);
  return data.settings;
}

export function getLineStartingPrice(
  products: Product[],
  line: ProductLine,
): number | null {
  const lineProducts = products.filter(
    (p) => p.type === "pc" && p.line === line && p.stock > 0,
  );
  if (lineProducts.length === 0) return null;
  return Math.min(...lineProducts.map((p) => p.price));
}
