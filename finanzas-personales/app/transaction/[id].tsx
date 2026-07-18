import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, PrimaryButton, Screen, Title } from '../../src/components/ui';
import { useFinance } from '../../src/context/FinanceContext';
import {
  formatDateLong,
  formatMoney,
  formatTime,
  getCategoryLabel,
  typeLabel,
} from '../../src/lib/categories';
import { colors, spacing } from '../../src/theme';

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function TransactionDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, removeTransaction } = useFinance();

  const tx = state.transactions.find((t) => t.id === id);

  if (!tx) {
    return (
      <Screen style={{ paddingTop: insets.top + 12 }}>
        <Title>Movimiento</Title>
        <Text style={styles.missing}>No se encontró este movimiento.</Text>
        <PrimaryButton label="Volver" onPress={() => router.back()} tone="muted" />
      </Screen>
    );
  }

  const isIncome = tx.type === 'giro';
  const accent = isIncome
    ? colors.income
    : tx.type === 'gasto'
      ? colors.expense
      : colors.warning;

  const whatLabel = isIncome ? 'En qué lo ganaste' : 'En qué lo gastaste';
  const whatValue = getCategoryLabel(tx.type, tx.category);
  const detail = tx.note.trim() || 'Sin nota';

  return (
    <Screen style={{ paddingTop: insets.top + 12 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Title>{typeLabel(tx.type)}</Title>
          <View style={{ width: 36 }} />
        </View>

        <Card style={styles.hero}>
          <Text style={styles.heroLabel}>Monto</Text>
          <Text style={[styles.heroAmount, { color: accent }]}>
            {isIncome ? '+' : '-'}
            {formatMoney(tx.amount)}
          </Text>
        </Card>

        <Card style={styles.details}>
          <DetailRow label={whatLabel} value={whatValue} />
          <DetailRow label="Detalle / nota" value={detail} />
          <DetailRow label="Día" value={formatDateLong(tx.date)} />
          <DetailRow
            label="Hora"
            value={formatTime(tx.time, tx.createdAt)}
          />
          <DetailRow label="Tipo" value={typeLabel(tx.type)} />
          <DetailRow label="Fecha (AAAA-MM-DD)" value={tx.date} />
        </Card>

        <PrimaryButton
          label="Eliminar movimiento"
          tone="expense"
          onPress={() =>
            Alert.alert('Eliminar', '¿Borrar este movimiento?', [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Eliminar',
                style: 'destructive',
                onPress: () => {
                  removeTransaction(tx.id);
                  router.back();
                },
              },
            ])
          }
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: 40,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hero: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 24,
  },
  heroLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  heroAmount: {
    fontWeight: '700',
    fontSize: 40,
    letterSpacing: -1,
  },
  details: {
    gap: 14,
  },
  row: {
    gap: 4,
  },
  label: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  missing: {
    color: colors.textMuted,
    marginVertical: 16,
    lineHeight: 22,
  },
});
