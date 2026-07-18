import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppCurrency, AppLanguage, ThemeMode } from '../i18n';

const SETTINGS_KEY = 'finanzas:settings:v1';

export type AppSettings = {
  themeMode: ThemeMode;
  language: AppLanguage;
  currency: AppCurrency;
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  saturdayBonusEnabled: boolean;
};

export const defaultSettings: AppSettings = {
  themeMode: 'system',
  language: 'es',
  currency: 'USD',
  notificationsEnabled: true,
  hapticsEnabled: true,
  saturdayBonusEnabled: true,
};

export async function loadAppSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...defaultSettings,
      ...parsed,
    };
  } catch {
    return defaultSettings;
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
