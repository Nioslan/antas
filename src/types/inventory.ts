export type ProductLine = "renew" | "hybrid" | "elite";
export type ProductCategory = "gaming" | "streaming" | "trabajo" | "ia";
export type ProductType = "pc" | "component" | "other";
export type ComponentType =
  | "ram"
  | "gpu"
  | "cpu"
  | "ssd"
  | "psu"
  | "motherboard"
  | "cooling"
  | "case"
  | "other";

export type ProductSpecs = {
  cpu?: string;
  gpu?: string;
  ram?: string;
  ssd?: string;
  psu?: string;
  motherboard?: string;
  cooling?: string;
};

export type Product = {
  id: string;
  type: ProductType;
  componentType?: ComponentType;
  name: string;
  description?: string;
  price: number;
  stock: number;
  image: string;
  /** Extra gallery photos (max 5). Cover stays in `image`. */
  images?: string[];
  /** Optional product video (PC builds: Renew / Hybrid / Elite). */
  video?: string;
  line?: ProductLine;
  category?: ProductCategory;
  brand?: string;
  specs?: ProductSpecs;
  createdAt: string;
  updatedAt: string;
};

export type InventorySettings = {
  logo: string;
  lineImages: Record<ProductLine, string>;
};

export type InventoryData = {
  settings: InventorySettings;
  products: Product[];
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  pc: "PC completa",
  component: "Componente",
  other: "Otro",
};

export const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  ram: "RAM",
  gpu: "GPU / Tarjeta gráfica",
  cpu: "Procesador",
  ssd: "SSD / Almacenamiento",
  psu: "Fuente de poder",
  motherboard: "Motherboard",
  cooling: "Refrigeración",
  case: "Gabinete",
  other: "Otro componente",
};

export const LINE_LABELS: Record<ProductLine, string> = {
  renew: "PC Renew",
  hybrid: "PC Hybrid",
  elite: "PC Elite",
};

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  gaming: "Gaming",
  streaming: "Streaming",
  trabajo: "Trabajo",
  ia: "IA",
};
