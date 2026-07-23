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
  isBuiltinCategory,
  resolveGastoCategories,
  resolveGiroCategories,
  type CategoryOption,
  type EditableCategoryKind,
} from '../lib/categories';
import { configureMoneyFormat } from '../lib/moneyFormat';
import { clampBonusPercent } from '../lib/saturdayBonus';
import { darkColors, lightColors, type ThemeColors } from '../theme';

type CatResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

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
  giroCategories: CategoryOption[];
  addEditableCategory: (
    kind: EditableCategoryKind,
    label: string
  ) => CatResult & { id?: string };
  renameEditableCategory: (
    kind: EditableCategoryKind,
    id: string,
    label: string
  ) => CatResult;
  removeEditableCategory: (
    kind: EditableCategoryKind,
    id: string
  ) => CatResult;
  /** @deprecated use addEditableCategory('gasto', …) */
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

  const listForKind = useCallback(
    (kind: EditableCategoryKind) => {
      if (kind === 'gasto') {
        return resolveGastoCategories({
          customGastoCategories: settings.customGastoCategories,
          gastoCategoryLabels: settings.gastoCategoryLabels,
        });
      }
      return resolveGiroCategories({
        customCategories: settings.customGiroCategories,
        categoryLabels: settings.giroCategoryLabels,
      });
    },
    [
      settings.customGastoCategories,
      settings.gastoCategoryLabels,
      settings.customGiroCategories,
      settings.giroCategoryLabels,
    ]
  );

  const addEditableCategory = useCallback(
    (kind: EditableCategoryKind, label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return { ok: false as const, error: 'Escribí un nombre.' };
      if (trimmed.length > 40) {
        return { ok: false as const, error: 'Máximo 40 caracteres.' };
      }
      const list = listForKind(kind);
      if (list.some((c) => c.label.toLowerCase() === trimmed.toLowerCase())) {
        return { ok: false as const, error: 'Esa categoría ya existe.' };
      }
      const id = makeUniqueCategoryId(
        trimmed,
        list.map((c) => c.id)
      );
      setSettings((prev) =>
        kind === 'gasto'
          ? {
              ...prev,
              customGastoCategories: [
                ...prev.customGastoCategories,
                { id, label: trimmed, custom: true },
              ],
            }
          : {
              ...prev,
              customGiroCategories: [
                ...prev.customGiroCategories,
                { id, label: trimmed, custom: true },
              ],
            }
      );
      return { ok: true as const, id };
    },
    [listForKind]
  );

  const renameEditableCategory = useCallback(
    (kind: EditableCategoryKind, id: string, label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return { ok: false as const, error: 'Escribí un nombre.' };
      if (trimmed.length > 40) {
        return { ok: false as const, error: 'Máximo 40 caracteres.' };
      }
      const list = listForKind(kind);
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
      setSettings((prev) =>
        kind === 'gasto'
          ? {
              ...prev,
              gastoCategoryLabels: {
                ...prev.gastoCategoryLabels,
                [id]: trimmed,
              },
              customGastoCategories: prev.customGastoCategories.map((c) =>
                c.id === id ? { ...c, label: trimmed } : c
              ),
            }
          : {
              ...prev,
              giroCategoryLabels: {
                ...prev.giroCategoryLabels,
                [id]: trimmed,
              },
              customGiroCategories: prev.customGiroCategories.map((c) =>
                c.id === id ? { ...c, label: trimmed } : c
              ),
            }
      );
      return { ok: true as const };
    },
    [listForKind]
  );

  const removeEditableCategory = useCallback(
    (kind: EditableCategoryKind, id: string) => {
      if (isBuiltinCategory(kind, id)) {
        return {
          ok: false as const,
          error: 'Las categorías base no se borran; podés renombrarlas.',
        };
      }
      setSettings((prev) => {
        if (kind === 'gasto') {
          const { [id]: _r, ...rest } = prev.gastoCategoryLabels;
          return {
            ...prev,
            customGastoCategories: prev.customGastoCategories.filter(
              (c) => c.id !== id
            ),
            gastoCategoryLabels: rest,
          };
        }
        const { [id]: _r, ...rest } = prev.giroCategoryLabels;
        return {
          ...prev,
          customGiroCategories: prev.customGiroCategories.filter(
            (c) => c.id !== id
          ),
          giroCategoryLabels: rest,
        };
      });
      return { ok: true as const };
    },
    []
  );

  const gastoCategories = useMemo(
    () =>
      resolveGastoCategories({
        customGastoCategories: settings.customGastoCategories,
        gastoCategoryLabels: settings.gastoCategoryLabels,
      }),
    [settings.customGastoCategories, settings.gastoCategoryLabels]
  );

  const giroCategories = useMemo(
    () =>
      resolveGiroCategories({
        customCategories: settings.customGiroCategories,
        categoryLabels: settings.giroCategoryLabels,
      }),
    [settings.customGiroCategories, settings.giroCategoryLabels]
  );

  const addGastoCategory = useCallback(
    (label: string) => {
      const r = addEditableCategory('gasto', label);
      if (!r.ok) return r;
      return { ok: true as const, id: r.id! };
    },
    [addEditableCategory]
  );

  const renameGastoCategory = useCallback(
    (id: string, label: string) => renameEditableCategory('gasto', id, label),
    [renameEditableCategory]
  );

  const removeGastoCategory = useCallback(
    (id: string) => removeEditableCategory('gasto', id),
    [removeEditableCategory]
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
      giroCategories,
      addEditableCategory,
      renameEditableCategory,
      removeEditableCategory,
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
      giroCategories,
      addEditableCategory,
      renameEditableCategory,
      removeEditableCategory,
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
