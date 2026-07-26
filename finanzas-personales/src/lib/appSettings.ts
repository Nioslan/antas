import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppCurrency, AppLanguage, ThemeMode } from '../i18n';
import {
  configureCategories,
  slugifyCategoryLabel,
  type CategoryOption,
} from './categories';
import { clampBonusPercent } from './saturdayBonus';

const SETTINGS_KEY = 'finanzas:settings:v1';

export type AppSettings = {
  themeMode: ThemeMode;
  language: AppLanguage;
  currency: AppCurrency;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  saturdayBonusEnabled: boolean;
  /** Porcentaje del libre semanal que se suma a Ahorro (0–100). */
  saturdayBonusPercent: number;
  /** Categorías de gasto creadas por el usuario. */
  customGastoCategories: CategoryOption[];
  /** Renombres de categorías de gasto (builtin o custom). */
  gastoCategoryLabels: Record<string, string>;
  /** Categorías de ingreso creadas por el usuario. */
  customGiroCategories: CategoryOption[];
  /** Renombres de categorías de ingreso (builtin o custom). */
  giroCategoryLabels: Record<string, string>;
};

export const defaultSettings: AppSettings = {
  themeMode: 'system',
  language: 'es',
  currency: 'USD',
  // Off por defecto: evita tocar expo-notifications al primer arranque en Android.
  notificationsEnabled: false,
  hapticsEnabled: true,
  saturdayBonusEnabled: true,
  saturdayBonusPercent: 20,
  customGastoCategories: [],
  gastoCategoryLabels: {},
  customGiroCategories: [],
  giroCategoryLabels: {},
};

function normalizeCustomCategories(raw: unknown): CategoryOption[] {
  if (!Array.isArray(raw)) return [];
  const out: CategoryOption[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const id = String((item as CategoryOption).id ?? '').trim();
    const label = String((item as CategoryOption).label ?? '').trim();
    if (!id || !label || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label, custom: true });
  }
  return out;
}

function normalizeLabelMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string' && value.trim()) {
      out[key] = value.trim();
    }
  }
  return out;
}

export function applyCategoryConfigToRuntime(settings: AppSettings): void {
  configureCategories({
    customGastoCategories: settings.customGastoCategories,
    gastoCategoryLabels: settings.gastoCategoryLabels,
    customGiroCategories: settings.customGiroCategories,
    giroCategoryLabels: settings.giroCategoryLabels,
  });
}

export async function loadAppSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...defaultSettings,
      ...parsed,
      saturdayBonusPercent: clampBonusPercent(
        typeof parsed.saturdayBonusPercent === 'number'
          ? parsed.saturdayBonusPercent
          : defaultSettings.saturdayBonusPercent
      ),
      customGastoCategories: normalizeCustomCategories(
        parsed.customGastoCategories
      ),
      gastoCategoryLabels: normalizeLabelMap(parsed.gastoCategoryLabels),
      customGiroCategories: normalizeCustomCategories(
        parsed.customGiroCategories
      ),
      giroCategoryLabels: normalizeLabelMap(parsed.giroCategoryLabels),
    };
  } catch {
    return defaultSettings;
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      ...settings,
      saturdayBonusPercent: clampBonusPercent(settings.saturdayBonusPercent),
      customGastoCategories: normalizeCustomCategories(
        settings.customGastoCategories
      ),
      gastoCategoryLabels: normalizeLabelMap(settings.gastoCategoryLabels),
      customGiroCategories: normalizeCustomCategories(
        settings.customGiroCategories
      ),
      giroCategoryLabels: normalizeLabelMap(settings.giroCategoryLabels),
    })
  );
}

export function makeUniqueCategoryId(
  label: string,
  existingIds: string[]
): string {
  const taken = new Set(existingIds);
  let base = slugifyCategoryLabel(label);
  if (!base.startsWith('custom_')) base = `custom_${base}`;
  let id = base;
  let n = 2;
  while (taken.has(id)) {
    id = `${base}_${n}`;
    n += 1;
  }
  return id;
}
