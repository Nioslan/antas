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
import { formatMoney, todayKey } from '../src/lib/categories';
import { envelopeSpent } from '../src/lib/projection';
import { spacing, type ThemeColors } from '../src/theme';

export default function EnvelopesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { state, addEnvelope, removeEnvelope } = useFinance();
  const { gastoCategories } = useSettings();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string | undefined>();

  const rows = useMemo(() => {
    const month = todayKey();
    return (state.envelopes ?? []).map((e) => {
      const spent = envelopeSpent(
        state.transactions,
        e.id,
        e.category,
        month
      );
      const left = Math.round((e.allocated - spent) * 100) / 100;
      const pct = e.allocated > 0 ? Math.min(999, (spent / e.allocated) * 100) : 0;
      return { ...e, spent, left, pct };
    });
  }, [state.envelopes, state.transactions]);

  const onAdd = () => {
    const n = Number(String(amount).replace(',', '.'));
    if (!name.trim()) {
      Alert.alert('Nombre', 'Poné un nombre al sobre.');
      return;
    }
    if (!Number.isFinite(n) || n <= 0) {
      Alert.alert('Monto', 'Asigná un monto mayor a 0.');
      return;
    }
    addEnvelope({ name, allocated: n, category });
    setName('');
    setAmount('');
    setCategory(undefined);
  };

  return (
    <Screen style={{ paddingTop: insets.top + 8 }}>
      <KeyboardForm contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Title>Sobres</Title>
            <Subtitle>
              Partí tu plata del mes: comida, transporte, caprichos… Ves cuánto
              te queda en cada sobre.
            </Subtitle>
          </View>
        </View>

        <Card style={{ gap: 8 }}>
          <Text style={styles.label}>Nuevo sobre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej. Comida"
            placeholderTextColor={colors.textDim}
          />
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="Plata asignada"
            placeholderTextColor={colors.textDim}
          />
          <Text style={styles.hint}>Categoría opcional (auto-cuenta gastos)</Text>
          <View style={styles.chips}>
            <Pressable
              style={[styles.chip, !category && styles.chipOn]}
              onPress={() => setCategory(undefined)}
            >
              <Text style={styles.chipText}>Ninguna</Text>
            </Pressable>
            {gastoCategories.slice(0, 8).map((c) => (
              <Pressable
                key={c.id}
                style={[styles.chip, category === c.id && styles.chipOn]}
                onPress={() => setCategory(c.id)}
              >
                <Text style={styles.chipText}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
          <PrimaryButton label="Crear sobre" onPress={onAdd} />
        </Card>

        {rows.length === 0 ? (
          <Card>
            <Text style={styles.empty}>
              Todavía no hay sobres. Creá uno y los gastos de esa categoría se
              descuentan solos.
            </Text>
          </Card>
        ) : (
          rows.map((row) => {
            const color =
              row.left < 0
                ? colors.expense
                : row.pct >= 85
                  ? colors.warning
                  : colors.income;
            return (
              <Card key={row.id} style={{ gap: 8 }}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowTitle}>{row.name}</Text>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Borrar sobre', `¿Sacar ${row.name}?`, [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Borrar',
                          style: 'destructive',
                          onPress: () => removeEnvelope(row.id),
                        },
                      ])
                    }
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.textDim} />
                  </Pressable>
                </View>
                <Text style={styles.meta}>
                  {formatMoney(row.spent)} de {formatMoney(row.allocated)} ·{' '}
                  {Math.round(row.pct)}%
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(100, row.pct)}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.left, { color }]}>
                  {row.left >= 0
                    ? `Quedan ${formatMoney(row.left)}`
                    : `Pasaste por ${formatMoney(Math.abs(row.left))}`}
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
    content: { paddingBottom: 48, gap: spacing.md },
    head: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
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
    label: { color: colors.text, fontWeight: '700', fontSize: 14 },
    hint: { color: colors.textDim, fontSize: 12 },
    input: {
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.text,
      fontSize: 15,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    chipOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
    chipText: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
    empty: { color: colors.textMuted, lineHeight: 22 },
    rowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
    meta: { color: colors.textDim, fontSize: 12 },
    barTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 4 },
    left: { fontWeight: '600', fontSize: 13 },
  });
}
