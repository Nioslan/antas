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
  applyCategoryConfigToRuntime,
  defaultSettings,
  loadAppSettings,
  makeUniqueCategoryId,
  saveAppSettings,
  type AppSettings,
} from '../lib/appSettings';
import {
  isBuiltinGastoCategory,
  resolveGastoCategories,
  type CategoryOption,
} from '../lib/categories';
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
  gastoCategories: CategoryOption[];
  addGastoCategory: (label: string) => { ok: true; id: string } | { ok: false; error: string };
  renameGastoCategory: (
    id: string,
    label: string
  ) => { ok: true } | { ok: false; error: string };
  removeGastoCategory: (
    id: string
  ) => { ok: true } | { ok: false; error: string };
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
      applyCategoryConfigToRuntime(loaded);
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
    applyCategoryConfigToRuntime(settings);
    void saveAppSettings(settings);
    configureMoneyFormat(settings.currency, settings.language);
  }, [settings, ready]);

  const scheme = resolveScheme(settings.themeMode, systemScheme);
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const addGastoCategory = useCallback(
    (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return { ok: false as const, error: 'Escribí un nombre.' };
      if (trimmed.length > 40) {
        return { ok: false as const, error: 'Máximo 40 caracteres.' };
      }

      const list = resolveGastoCategories({
        customGastoCategories: settings.customGastoCategories,
        gastoCategoryLabels: settings.gastoCategoryLabels,
      });
      if (
        list.some((c) => c.label.toLowerCase() === trimmed.toLowerCase())
      ) {
        return { ok: false as const, error: 'Esa categoría ya existe.' };
      }
      const id = makeUniqueCategoryId(
        trimmed,
        list.map((c) => c.id)
      );
      setSettings((prev) => ({
        ...prev,
        customGastoCategories: [
          ...prev.customGastoCategories,
          { id, label: trimmed, custom: true },
        ],
      }));
      return { ok: true as const, id };
    },
    [settings.customGastoCategories, settings.gastoCategoryLabels]
  );

  const renameGastoCategory = useCallback(
    (id: string, label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return { ok: false as const, error: 'Escribí un nombre.' };
      if (trimmed.length > 40) {
        return { ok: false as const, error: 'Máximo 40 caracteres.' };
      }

      const list = resolveGastoCategories({
        customGastoCategories: settings.customGastoCategories,
        gastoCategoryLabels: settings.gastoCategoryLabels,
      });
      if (!list.some((c) => c.id === id)) {
        return { ok: false as const, error: 'Categoría no encontrada.' };
      }
      if (
        list.some(
          (c) =>
            c.id !== id && c.label.toLowerCase() === trimmed.toLowerCase()
        )
      ) {
        return { ok: false as const, error: 'Esa categoría ya existe.' };
      }

      setSettings((prev) => ({
        ...prev,
        gastoCategoryLabels: {
          ...prev.gastoCategoryLabels,
          [id]: trimmed,
        },
        customGastoCategories: prev.customGastoCategories.map((c) =>
          c.id === id ? { ...c, label: trimmed } : c
        ),
      }));
      return { ok: true as const };
    },
    [settings.customGastoCategories, settings.gastoCategoryLabels]
  );

  const removeGastoCategory = useCallback((id: string) => {
    if (isBuiltinGastoCategory(id)) {
      return {
        ok: false as const,
        error: 'Las categorías base no se borran; podés renombrarlas.',
      };
    }
    setSettings((prev) => {
      const { [id]: _removed, ...restLabels } = prev.gastoCategoryLabels;
      return {
        ...prev,
        customGastoCategories: prev.customGastoCategories.filter(
          (c) => c.id !== id
        ),
        gastoCategoryLabels: restLabels,
      };
    });
    return { ok: true as const };
  }, []);

  const gastoCategories = useMemo(
    () =>
      resolveGastoCategories({
        customGastoCategories: settings.customGastoCategories,
        gastoCategoryLabels: settings.gastoCategoryLabels,
      }),
    [settings.customGastoCategories, settings.gastoCategoryLabels]
  );

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
      gastoCategories,
      addGastoCategory,
      renameGastoCategory,
      removeGastoCategory,
      updateSettings,
      currencyOptions: CURRENCY_OPTIONS,
    }),
    [
      ready,
      settings,
      colors,
      isDark,
      updateSettings,
      gastoCategories,
      addGastoCategory,
      renameGastoCategory,
      removeGastoCategory,
    ]
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
