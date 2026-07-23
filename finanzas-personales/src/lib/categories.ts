import type {
  Category,
  GastoCategory,
  GiroCategory,
  InversionCategory,
  TransactionType,
} from '../types/finance';
import { formatMoneyAmount, getActiveCurrency } from './moneyFormat';

export type CategoryOption = {
  id: string;
  label: string;
  /** Categoría creada por el usuario */
  custom?: boolean;
};

export type GastoCategoryConfig = {
  customGastoCategories: CategoryOption[];
  gastoCategoryLabels: Record<string, string>;
};

const emptyGastoConfig: GastoCategoryConfig = {
  customGastoCategories: [],
  gastoCategoryLabels: {},
};

let activeGastoConfig: GastoCategoryConfig = emptyGastoConfig;

export function configureGastoCategories(config: Partial<GastoCategoryConfig>): void {
  activeGastoConfig = {
    customGastoCategories: Array.isArray(config.customGastoCategories)
      ? config.customGastoCategories
      : activeGastoConfig.customGastoCategories,
    gastoCategoryLabels:
      config.gastoCategoryLabels && typeof config.gastoCategoryLabels === 'object'
        ? config.gastoCategoryLabels
        : activeGastoConfig.gastoCategoryLabels,
  };
}

export function getGastoCategoryConfig(): GastoCategoryConfig {
  return activeGastoConfig;
}

export const INVERSION_CATEGORIES: {
  id: InversionCategory;
  label: string;
}[] = [
  { id: 'inversiones', label: 'Inversiones' },
  { id: 'ahorro', label: 'Ahorro' },
  { id: 'otros', label: 'Otros' },
];

export const GASTO_CATEGORIES: { id: GastoCategory; label: string }[] = [
  { id: 'comida', label: 'Comida' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'gasolina', label: 'Gasolina' },
  { id: 'vivienda', label: 'Vivienda' },
  { id: 'salud', label: 'Salud' },
  { id: 'ocio', label: 'Ocio' },
  { id: 'personal', label: 'Personal' },
  { id: 'inversiones', label: 'Inversiones' },
  { id: 'otros', label: 'Otros' },
];

export const GIRO_CATEGORIES: { id: GiroCategory; label: string }[] = [
  { id: 'salario', label: 'Salario' },
  { id: 'trabajo', label: 'Trabajo' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'otros', label: 'Otros' },
];

const BUILTIN_GASTO_IDS = new Set(GASTO_CATEGORIES.map((c) => c.id));

export function isBuiltinGastoCategory(id: string): boolean {
  return BUILTIN_GASTO_IDS.has(id as GastoCategory);
}

export function slugifyCategoryLabel(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return base || `cat_${Date.now().toString(36)}`;
}

export function resolveGastoCategories(
  config: GastoCategoryConfig = activeGastoConfig
): CategoryOption[] {
  const labels = config.gastoCategoryLabels ?? {};
  const builtins: CategoryOption[] = GASTO_CATEGORIES.map((c) => ({
    id: c.id,
    label: labels[c.id]?.trim() || c.label,
  }));
  const customs = (config.customGastoCategories ?? [])
    .filter((c) => c?.id && c?.label)
    .map((c) => ({
      id: c.id,
      label: labels[c.id]?.trim() || c.label,
      custom: true as const,
    }));
  return [...builtins, ...customs];
}

export function getCategories(type: TransactionType): CategoryOption[] {
  if (type === 'inversion') return INVERSION_CATEGORIES;
  if (type === 'gasto') return resolveGastoCategories();
  return GIRO_CATEGORIES;
}

export function getCategoryLabel(type: TransactionType, category: string): string {
  if (type === 'gasto') {
    const override = activeGastoConfig.gastoCategoryLabels[category]?.trim();
    if (override) return override;
  }
  return getCategories(type).find((c) => c.id === category)?.label ?? category;
}

export function typeLabel(type: TransactionType): string {
  if (type === 'inversion') return 'Inversión';
  if (type === 'gasto') return 'Gasto';
  return 'Ingreso';
}

export function formatMoney(amount: number, currency?: string): string {
  return formatMoneyAmount(amount, currency ?? getActiveCurrency());
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function nowTimeKey(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

export function formatTime(time?: string, createdAt?: string): string {
  if (time && /^\d{2}:\d{2}/.test(time)) {
    return time.slice(0, 5);
  }
  if (createdAt) {
    const d = new Date(createdAt);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
  }
  return '--:--';
}

export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function monthKey(iso = todayKey()): string {
  return iso.slice(0, 7);
}

export function isInDay(isoDate: string, day = todayKey()): boolean {
  return isoDate === day;
}

export function isInMonth(isoDate: string, key = monthKey()): boolean {
  return isoDate.startsWith(key);
}

export function defaultCategory(type: TransactionType): Category {
  if (type === 'inversion') return 'inversiones';
  if (type === 'gasto') return 'comida';
  return 'trabajo';
}
