import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardForm } from '../src/components/KeyboardForm';
import {
  Card,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../src/components/ui';
import { useFinance } from '../src/context/FinanceContext';
import { useSettings, useTheme } from '../src/context/SettingsContext';
import {
  buildBudgetRows,
  budgetTotals,
  type BudgetStatus,
} from '../src/lib/budgets';
import { formatMoney, monthKey } from '../src/lib/categories';
import { radius, spacing, type ThemeColors } from '../src/theme';

function statusColor(status: BudgetStatus, colors: ThemeColors): string {
  if (status === 'over') return colors.expense;
  if (status === 'warn') return colors.warning;
  if (status === 'ok') return colors.income;
  return colors.textDim;
}

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { state, setCategoryBudget, removeCategoryBudget } = useFinance();
  const { gastoCategories } = useSettings();

  const [selected, setSelected] = useState(gastoCategories[0]?.id ?? 'comida');
  const [amount, setAmount] = useState('');

  const month = monthKey();
  const rows = useMemo(() => buildBudgetRows(state, month), [state, month]);
  const totals = useMemo(() => budgetTotals(rows), [rows]);

  const onSave = () => {
    const n = Number(String(amount).replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert('Monto', 'Poné un tope mayor a 0.');
      return;
    }
    setCategoryBudget(selected, n);
    setAmount('');
  };

  return (
    <Screen style={{ paddingTop: insets.top + 8 }}>
      <KeyboardForm contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Title>Presupuestos</Title>
            <Subtitle>
              Tope mensual por categoría. Así ves si te estás pasando antes de
              fin de mes.
            </Subtitle>
          </View>
        </View>

        <Card style={styles.summary}>
          <Text style={styles.summaryLabel}>Mes · {month}</Text>
          <Text style={styles.summaryValue}>
            {formatMoney(totals.spent)} / {formatMoney(totals.limit || 0)}
          </Text>
          <Text style={styles.summaryHint}>
            {rows.length === 0
              ? 'Todavía no definiste topes.'
              : totals.overCount > 0
                ? `${totals.overCount} categoría${totals.overCount === 1 ? '' : 's'} pasaron el límite.`
                : `Te quedan ${formatMoney(totals.remaining)} del total presupuestado.`}
          </Text>
        </Card>

        <Text style={styles.section}>Nuevo tope</Text>
        <View style={styles.chips}>
          {gastoCategories.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                setSelected(c.id);
                const existing = state.categoryBudgets?.[c.id];
                setAmount(existing ? String(existing) : '');
              }}
              style={[
                styles.chip,
                selected === c.id && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selected === c.id && styles.chipTextActive,
                ]}
              >
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="Tope del mes (ej. 150)"
          placeholderTextColor={colors.textDim}
        />
        <PrimaryButton label="Guardar presupuesto" onPress={onSave} />

        <Text style={styles.section}>Este mes</Text>
        {rows.length === 0 ? (
          <Card>
            <Text style={styles.empty}>
              Elegí una categoría, poné un tope y guardá. El home te va a avisar
              cuando te acerques al límite.
            </Text>
          </Card>
        ) : (
          rows.map((row) => {
            const bar = Math.min(100, row.pct);
            const color = statusColor(row.status, colors);
            return (
              <Card key={row.category} style={styles.row}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        'Quitar presupuesto',
                        `¿Sacar el tope de ${row.label}?`,
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: 'Quitar',
                            style: 'destructive',
                            onPress: () => removeCategoryBudget(row.category),
                          },
                        ]
                      )
                    }
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.textDim} />
                  </Pressable>
                </View>
                <Text style={styles.rowMeta}>
                  {formatMoney(row.spent)} de {formatMoney(row.limit)} ·{' '}
                  {Math.round(row.pct)}%
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${bar}%`, backgroundColor: color },
                    ]}
                  />
                </View>
                <Text style={[styles.rowStatus, { color }]}>
                  {row.status === 'over'
                    ? `Pasaste por ${formatMoney(Math.abs(row.remaining))}`
                    : `Quedan ${formatMoney(row.remaining)}`}
                </Text>
              </Card>
            );
          })
        )}
      </KeyboardForm>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      paddingBottom: 48,
      gap: spacing.md,
    },
    head: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    back: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 2,
    },
    summary: { gap: 6 },
    summaryLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
    summaryValue: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    summaryHint: { color: colors.textDim, fontSize: 13, lineHeight: 18 },
    section: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 16,
      marginTop: 4,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill ?? 999,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
    chipTextActive: { color: colors.bg },
    input: {
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 16,
    },
    empty: { color: colors.textMuted, lineHeight: 22 },
    row: { gap: 8 },
    rowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowLabel: { color: colors.text, fontWeight: '700', fontSize: 15 },
    rowMeta: { color: colors.textDim, fontSize: 12 },
    barTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 4 },
    rowStatus: { fontSize: 12, fontWeight: '600' },
  });
}
