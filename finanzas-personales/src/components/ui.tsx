import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../context/SettingsContext';
import { useKeyboardFormFocus } from './KeyboardForm';
import { radius, spacing, type ThemeColors } from '../theme';

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }, style]}>
      {children}
    </View>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.title, { color: colors.text }]}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.subtitle, { color: colors.textMuted }]}>{children}</Text>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  tone = 'accent',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'accent' | 'expense' | 'muted';
}) {
  const { colors } = useTheme();
  const bg =
    tone === 'expense'
      ? colors.expense
      : tone === 'muted'
        ? colors.bgElevated
        : colors.accent;
  const textColor = tone === 'muted' ? colors.text : colors.bg;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  onFocus,
  ...props
}: TextInputProps & { label: string }) {
  const { colors } = useTheme();
  const ensureVisible = useKeyboardFormFocus();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textDim}
        style={[
          styles.input,
          {
            backgroundColor: colors.bgElevated,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        {...props}
        onFocus={(e) => {
          ensureVisible?.();
          onFocus?.(e);
        }}
      />
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.accentSoft : colors.bgElevated,
          borderColor: active ? colors.accent : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.accent : colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SettingsRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  danger,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  const content = (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
        },
      ]}
    >
      {icon ? <View style={styles.rowIcon}>{icon}</View> : null}
      <View style={styles.rowBody}>
        <Text
          style={[
            styles.rowTitle,
            { color: danger ? colors.expense : colors.text },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      {content}
    </Pressable>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.segment,
        { backgroundColor: colors.bgElevated, borderColor: colors.border },
      ]}
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={[
              styles.segmentItem,
              active && { backgroundColor: colors.accentSoft },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: active ? colors.accent : colors.textMuted },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function makeThemeStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ThemeColors) => T
) {
  return factory;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    lineHeight: 22,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  button: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 28,
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
