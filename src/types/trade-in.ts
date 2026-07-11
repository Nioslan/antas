export type CoolingType = "aire" | "liquido-aio" | "liquido-custom";

export type TradeInSubmission = {
  id: string;
  photo: string;
  specs: {
    processor: string;
    motherboard: string;
    ram: string;
    storage: string;
    gpu: string;
    psu: string;
    coolingType: CoolingType;
    coolingDetail: string;
    extras?: string;
  };
  contact: {
    name: string;
    phone: string;
    email?: string;
  };
  status: "pending" | "reviewed";
  createdAt: string;
};

export type TradeInFormData = {
  photo: string;
  processor: string;
  motherboard: string;
  ram: string;
  storage: string;
  gpu: string;
  psu: string;
  coolingType: CoolingType;
  coolingDetail: string;
  extras: string;
  name: string;
  phone: string;
  email: string;
};

export const COOLING_LABELS: Record<CoolingType, string> = {
  aire: "Aire",
  "liquido-aio": "Líquido AIO",
  "liquido-custom": "Líquido custom",
};

export const SPEC_FIELDS = [
  {
    key: "processor" as const,
    label: "Procesador",
    placeholder: "Ej: Intel Core i5-12400F",
    icon: "cpu",
  },
  {
    key: "motherboard" as const,
    label: "Tarjeta madre",
    placeholder: "Ej: MSI B760M Mortar",
    icon: "motherboard",
  },
  {
    key: "ram" as const,
    label: "RAM",
    placeholder: "Ej: 16GB DDR4 3200MHz",
    icon: "memory",
  },
  {
    key: "storage" as const,
    label: "Almacenamiento",
    placeholder: "Ej: SSD NVMe 512GB",
    icon: "hard-drive",
  },
  {
    key: "gpu" as const,
    label: "Tarjeta gráfica",
    placeholder: "Ej: RTX 3060 12GB",
    icon: "gpu",
  },
  {
    key: "psu" as const,
    label: "Fuente de poder",
    placeholder: "Ej: 650W 80+ Bronze",
    icon: "zap",
  },
] as const;
