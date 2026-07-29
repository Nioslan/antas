export type ThemeColors = {
  bg: string;
  bgElevated: string;
  bgCard: string;
  border: string;
  text: string;
  textMuted: string;
  textDim: string;
  accent: string;
  accentSoft: string;
  income: string;
  expense: string;
  expenseSoft: string;
  warning: string;
  white: string;
};

export const darkColors: ThemeColors = {
  bg: '#0B1F1A',
  bgElevated: '#122E26',
  bgCard: '#16352C',
  border: '#234A3E',
  text: '#F2F7F4',
  textMuted: '#9BB5AB',
  textDim: '#6F8A7F',
  accent: '#3DDC97',
  accentSoft: 'rgba(61, 220, 151, 0.14)',
  income: '#3DDC97',
  expense: '#FF7A6E',
  expenseSoft: 'rgba(255, 122, 110, 0.14)',
  warning: '#F5C451',
  white: '#FFFFFF',
};

export const lightColors: ThemeColors = {
  bg: '#F4F7F5',
  bgElevated: '#FFFFFF',
  bgCard: '#FFFFFF',
  border: '#D5E3DC',
  text: '#0F241E',
  textMuted: '#5A7268',
  textDim: '#8A9E95',
  accent: '#0F9F6E',
  accentSoft: 'rgba(15, 159, 110, 0.12)',
  income: '#0F9F6E',
  expense: '#E24B3C',
  expenseSoft: 'rgba(226, 75, 60, 0.12)',
  warning: '#C98A12',
  white: '#FFFFFF',
};

/** Default / fallback (dark). Prefer useTheme().colors in components. */
export const colors = darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};
