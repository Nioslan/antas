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

export type EditableCategoryKind = 'gasto' | 'giro';

export type CategoryKindConfig = {
  customCategories: CategoryOption[];
  categoryLabels: Record<string, string>;
};

type CategoriesRuntimeConfig = {
  gasto: CategoryKindConfig;
  giro: CategoryKindConfig;
};

const emptyKindConfig = (): CategoryKindConfig => ({
  customCategories: [],
  categoryLabels: {},
});

let activeConfig: CategoriesRuntimeConfig = {
  gasto: emptyKindConfig(),
  giro: emptyKindConfig(),
};

/** @deprecated alias — prefer configureCategories */
export type GastoCategoryConfig = {
  customGastoCategories: CategoryOption[];
  gastoCategoryLabels: Record<string, string>;
};

export function configureCategories(config: {
  customGastoCategories?: CategoryOption[];
  gastoCategoryLabels?: Record<string, string>;
  customGiroCategories?: CategoryOption[];
  giroCategoryLabels?: Record<string, string>;
}): void {
  activeConfig = {
    gasto: {
      customCategories: Array.isArray(config.customGastoCategories)
        ? config.customGastoCategories
        : activeConfig.gasto.customCategories,
      categoryLabels:
        config.gastoCategoryLabels && typeof config.gastoCategoryLabels === 'object'
          ? config.gastoCategoryLabels
          : activeConfig.gasto.categoryLabels,
    },
    giro: {
      customCategories: Array.isArray(config.customGiroCategories)
        ? config.customGiroCategories
        : activeConfig.giro.customCategories,
      categoryLabels:
        config.giroCategoryLabels && typeof config.giroCategoryLabels === 'object'
          ? config.giroCategoryLabels
          : activeConfig.giro.categoryLabels,
    },
  };
}

export function configureGastoCategories(config: Partial<GastoCategoryConfig>): void {
  configureCategories({
    customGastoCategories: config.customGastoCategories,
    gastoCategoryLabels: config.gastoCategoryLabels,
  });
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
const BUILTIN_GIRO_IDS = new Set(GIRO_CATEGORIES.map((c) => c.id));

export function isBuiltinGastoCategory(id: string): boolean {
  return BUILTIN_GASTO_IDS.has(id as GastoCategory);
}

export function isBuiltinGiroCategory(id: string): boolean {
  return BUILTIN_GIRO_IDS.has(id as GiroCategory);
}

export function isBuiltinCategory(kind: EditableCategoryKind, id: string): boolean {
  return kind === 'gasto' ? isBuiltinGastoCategory(id) : isBuiltinGiroCategory(id);
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

function resolveKindCategories(
  builtins: CategoryOption[],
  config: CategoryKindConfig
): CategoryOption[] {
  const labels = config.categoryLabels ?? {};
  const base: CategoryOption[] = builtins.map((c) => ({
    id: c.id,
    label: labels[c.id]?.trim() || c.label,
  }));
  const customs = (config.customCategories ?? [])
    .filter((c) => c?.id && c?.label)
    .map((c) => ({
      id: c.id,
      label: labels[c.id]?.trim() || c.label,
      custom: true as const,
    }));
  return [...base, ...customs];
}

export function resolveGastoCategories(
  config?: GastoCategoryConfig | CategoryKindConfig
): CategoryOption[] {
  if (!config) {
    return resolveKindCategories(GASTO_CATEGORIES, activeConfig.gasto);
  }
  if ('customGastoCategories' in config) {
    return resolveKindCategories(GASTO_CATEGORIES, {
      customCategories: config.customGastoCategories ?? [],
      categoryLabels: config.gastoCategoryLabels ?? {},
    });
  }
  return resolveKindCategories(GASTO_CATEGORIES, config);
}

export function resolveGiroCategories(
  config: CategoryKindConfig = activeConfig.giro
): CategoryOption[] {
  return resolveKindCategories(GIRO_CATEGORIES, config);
}

export function resolveEditableCategories(
  kind: EditableCategoryKind
): CategoryOption[] {
  return kind === 'gasto' ? resolveGastoCategories() : resolveGiroCategories();
}

export function getCategories(type: TransactionType): CategoryOption[] {
  if (type === 'inversion') return INVERSION_CATEGORIES;
  if (type === 'gasto') return resolveGastoCategories();
  return resolveGiroCategories();
}

export function getCategoryLabel(type: TransactionType, category: string): string {
  if (type === 'gasto') {
    const override = activeConfig.gasto.categoryLabels[category]?.trim();
    if (override) return override;
  }
  if (type === 'giro') {
    const override = activeConfig.giro.categoryLabels[category]?.trim();
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

/** Guarda siempre HH:mm en 24h; la UI muestra 12h. */
export function nowTimeKey(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

export type Time12 = {
  hour: number; // 1–12
  minute: number; // 0–59
  period: 'AM' | 'PM';
};

export function hhmmToTime12(hhmm: string): Time12 {
  const match = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim());
  let hour24 = 0;
  let minute = 0;
  if (match) {
    hour24 = Math.min(23, Math.max(0, Number(match[1])));
    minute = Math.min(59, Math.max(0, Number(match[2])));
  }
  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
  let hour = hour24 % 12;
  if (hour === 0) hour = 12;
  return { hour, minute, period };
}

export function time12ToHhmm(parts: Time12): string {
  const minute = Math.min(59, Math.max(0, Math.round(parts.minute)));
  let hour12 = Math.round(parts.hour);
  if (hour12 < 1) hour12 = 1;
  if (hour12 > 12) hour12 = 12;
  let hour24 = hour12 % 12;
  if (parts.period === 'PM') hour24 += 12;
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatHour12(hour24: number, minute: number): string {
  const period = hour24 >= 12 ? 'p. m.' : 'a. m.';
  let hour = hour24 % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${String(minute).padStart(2, '0')} ${period}`;
}

export function formatTime(time?: string, createdAt?: string): string {
  if (time && /^\d{1,2}:\d{2}/.test(time)) {
    const { hour, minute, period } = hhmmToTime12(time);
    return `${hour}:${String(minute).padStart(2, '0')} ${
      period === 'PM' ? 'p. m.' : 'a. m.'
    }`;
  }
  if (createdAt) {
    const d = new Date(createdAt);
    if (!Number.isNaN(d.getTime())) {
      return formatHour12(d.getHours(), d.getMinutes());
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
