import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppCurrency, AppLanguage, ThemeMode } from '../i18n';
import { clampBonusPercent } from './saturdayBonus';

const SETTINGS_KEY = 'finanzas:settings:v1';

export type AppSettings = {
  themeMode: ThemeMode;
  language: AppLanguage;
  currency: AppCurrency;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  saturdayBonusEnabled: boolean;
  /** Porcentaje del libre semanal que se suma a Ahora (0–100). */
  saturdayBonusPercent: number;
};

export const defaultSettings: AppSettings = {
  themeMode: 'system',
  language: 'es',
  currency: 'USD',
  notificationsEnabled: true,
  hapticsEnabled: true,
  saturdayBonusEnabled: true,
  saturdayBonusPercent: 20,
};

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
    })
  );
}
