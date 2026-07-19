import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';
import {
  CURRENCY_OPTIONS,
  t,
  type AppCurrency,
  type AppLanguage,
  type ThemeMode,
} from '../i18n';
import {
  defaultSettings,
  loadAppSettings,
  saveAppSettings,
  type AppSettings,
} from '../lib/appSettings';
import { configureMoneyFormat } from '../lib/moneyFormat';
import { clampBonusPercent } from '../lib/saturdayBonus';
import { darkColors, lightColors, type ThemeColors } from '../theme';

type SettingsContextValue = {
  ready: boolean;
  settings: AppSettings;
  colors: ThemeColors;
  isDark: boolean;
  language: AppLanguage;
  tr: (key: string) => string;
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (lang: AppLanguage) => void;
  setCurrency: (currency: AppCurrency) => void;
  setNotificationsEnabled: (value: boolean) => void;
  setHapticsEnabled: (value: boolean) => void;
  setSaturdayBonusEnabled: (value: boolean) => void;
  setSaturdayBonusPercent: (value: number) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  currencyOptions: typeof CURRENCY_OPTIONS;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function resolveScheme(
  mode: ThemeMode,
  system: ColorSchemeName
): 'light' | 'dark' {
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';
  return system === 'light' ? 'light' : 'dark';
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    loadAppSettings().then((loaded) => {
      setSettings(loaded);
      configureMoneyFormat(loaded.currency, loaded.language);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ready) return;
    void saveAppSettings(settings);
    configureMoneyFormat(settings.currency, settings.language);
  }, [settings, ready]);

  const scheme = resolveScheme(settings.themeMode, systemScheme);
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ready,
      settings,
      colors,
      isDark,
      language: settings.language,
      tr: (key: string) => t(settings.language, key),
      setThemeMode: (themeMode) => updateSettings({ themeMode }),
      setLanguage: (language) => updateSettings({ language }),
      setCurrency: (currency) => updateSettings({ currency }),
      setNotificationsEnabled: (notificationsEnabled) =>
        updateSettings({ notificationsEnabled }),
      setHapticsEnabled: (hapticsEnabled) =>
        updateSettings({ hapticsEnabled }),
      setSaturdayBonusEnabled: (saturdayBonusEnabled) =>
        updateSettings({ saturdayBonusEnabled }),
      setSaturdayBonusPercent: (saturdayBonusPercent) =>
        updateSettings({
          saturdayBonusPercent: clampBonusPercent(saturdayBonusPercent),
        }),
      updateSettings,
      currencyOptions: CURRENCY_OPTIONS,
    }),
    [ready, settings, colors, isDark, updateSettings]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings debe usarse dentro de SettingsProvider');
  return ctx;
}

/** Theme colors that react to light/dark mode. */
export function useTheme() {
  const { colors, isDark } = useSettings();
  return { colors, isDark };
}
