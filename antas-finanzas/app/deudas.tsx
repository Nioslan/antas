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
  Chip,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../src/components/ui';
import { useFinance } from '../src/context/FinanceContext';
import { useTheme } from '../src/context/SettingsContext';
import { formatMoney } from '../src/lib/categories';
import type { DebtKind } from '../src/types/finance';
import { spacing, type ThemeColors } from '../src/theme';

export default function DeudasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { state, addDebt, payDebt, removeDebt } = useFinance();

  const [kind, setKind] = useState<DebtKind>('i_owe');
  const [name, setName] = useState('');
  const [total, setTotal] = useState('');
  const [cuota, setCuota] = useState('');
  const [dueDay, setDueDay] = useState('');

  const debts = state.debts ?? [];
  const iOwe = debts.filter((d) => d.kind === 'i_owe' && d.remaining > 0);
  const owed = debts.filter((d) => d.kind === 'owed_to_me' && d.remaining > 0);
  const oweSum = iOwe.reduce((a, d) => a + d.remaining, 0);
  const owedSum = owed.reduce((a, d) => a + d.remaining, 0);

  const onAdd = () => {
    const t = Number(String(total).replace(',', '.'));
    if (!name.trim() || !Number.isFinite(t) || t <= 0) {
      Alert.alert('Datos', 'Nombre y monto total son obligatorios.');
      return;
    }
    const inst = Number(String(cuota).replace(',', '.'));
    const day = Number(dueDay);
    addDebt({
      name,
      kind,
      totalAmount: t,
      installmentAmount: Number.isFinite(inst) && inst > 0 ? inst : undefined,
      dueDay: Number.isFinite(day) && day >= 1 && day <= 31 ? day : undefined,
    });
    setName('');
    setTotal('');
    setCuota('');
    setDueDay('');
  };

  const onPay = (id: string, label: string, installment?: number) => {
    Alert.prompt?.(
      kindLabel(label),
      '¿Cuánto pagás / cobrás ahora?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Registrar',
          onPress: (value?: string) => {
            const n = Number(String(value ?? installment ?? '').replace(',', '.'));
            if (Number.isFinite(n) && n > 0) payDebt(id, n);
          },
        },
      ],
      'plain-text',
      installment ? String(installment) : ''
    );
    // Web / Android sin Alert.prompt
    if (typeof Alert.prompt !== 'function') {
      const n = installment && installment > 0 ? installment : undefined;
      if (n) {
        Alert.alert('Registrar movimiento', `¿Aplicar ${formatMoney(n)}?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sí', onPress: () => payDebt(id, n) },
        ]);
      } else {
        Alert.alert(
          'Cuota',
          'Definí una cuota al crear la deuda para registrar pagos rápidos, o editá el saldo desde un backup.'
        );
      }
    }
  };

  return (
    <Screen style={{ paddingTop: insets.top + 8 }}>
      <KeyboardForm contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Title>Deudas y cuotas</Title>
            <Subtitle>
              Lo que debés, lo que te deben, y cuánto te libera cuando terminás.
            </Subtitle>
          </View>
        </View>

        <View style={styles.grid}>
          <Card style={styles.gridCard}>
            <Text style={styles.gridLabel}>Debo</Text>
            <Text style={[styles.gridValue, { color: colors.expense }]}>
              {formatMoney(oweSum)}
            </Text>
          </Card>
          <Card style={styles.gridCard}>
            <Text style={styles.gridLabel}>Me deben</Text>
            <Text style={[styles.gridValue, { color: colors.income }]}>
              {formatMoney(owedSum)}
            </Text>
          </Card>
        </View>

        <Card style={{ gap: 8 }}>
          <View style={styles.chips}>
            <Chip
              label="Yo debo"
              active={kind === 'i_owe'}
              onPress={() => setKind('i_owe')}
            />
            <Chip
              label="Me deben"
              active={kind === 'owed_to_me'}
              onPress={() => setKind('owed_to_me')}
            />
          </View>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nombre (ej. Tarjeta / Juan)"
            placeholderTextColor={colors.textDim}
          />
          <TextInput
            style={styles.input}
            value={total}
            onChangeText={setTotal}
            keyboardType="decimal-pad"
            placeholder="Saldo total"
            placeholderTextColor={colors.textDim}
          />
          <TextInput
            style={styles.input}
            value={cuota}
            onChangeText={setCuota}
            keyboardType="decimal-pad"
            placeholder="Cuota (opcional)"
            placeholderTextColor={colors.textDim}
          />
          <TextInput
            style={styles.input}
            value={dueDay}
            onChangeText={setDueDay}
            keyboardType="number-pad"
            placeholder="Día de vencimiento 1–31"
            placeholderTextColor={colors.textDim}
          />
          <PrimaryButton label="Agregar" onPress={onAdd} />
        </Card>

        {debts.length === 0 ? (
          <Card>
            <Text style={styles.empty}>Sin deudas cargadas.</Text>
          </Card>
        ) : (
          debts.map((d) => (
            <Card key={d.id} style={{ gap: 8 }}>
              <View style={styles.rowTop}>
                <Text style={styles.rowTitle}>{d.name}</Text>
                <Text
                  style={{
                    color:
                      d.kind === 'i_owe' ? colors.expense : colors.income,
                    fontWeight: '700',
                    fontSize: 12,
                  }}
                >
                  {d.kind === 'i_owe' ? 'Debo' : 'Me deben'}
                </Text>
              </View>
              <Text style={styles.meta}>
                Saldo {formatMoney(d.remaining)} de {formatMoney(d.totalAmount)}
                {d.installmentAmount
                  ? ` · cuota ${formatMoney(d.installmentAmount)}`
                  : ''}
                {d.dueDay ? ` · día ${d.dueDay}` : ''}
              </Text>
              <View style={styles.actions}>
                {d.remaining > 0 ? (
                  <PrimaryButton
                    label={d.kind === 'i_owe' ? 'Pagué' : 'Me pagaron'}
                    onPress={() => onPay(d.id, d.name, d.installmentAmount)}
                  />
                ) : (
                  <Text style={{ color: colors.income, fontWeight: '700' }}>
                    ¡Cerrada!
                  </Text>
                )}
                <Pressable
                  onPress={() =>
                    Alert.alert('Borrar', `¿Sacar ${d.name}?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Borrar',
                        style: 'destructive',
                        onPress: () => removeDebt(d.id),
                      },
                    ])
                  }
                >
                  <Text style={{ color: colors.textDim, fontWeight: '600' }}>
                    Eliminar
                  </Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </KeyboardForm>
    </Screen>
  );
}

function kindLabel(name: string) {
  return name;
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
    grid: { flexDirection: 'row', gap: 10 },
    gridCard: { flex: 1, gap: 4 },
    gridLabel: { color: colors.textMuted, fontSize: 13 },
    gridValue: { fontWeight: '700', fontSize: 20 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    empty: { color: colors.textMuted, lineHeight: 22 },
    rowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
    meta: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
    actions: { gap: 10 },
  });
}
