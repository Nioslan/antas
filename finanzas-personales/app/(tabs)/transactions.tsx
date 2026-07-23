import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip, PrimaryButton, Screen, Subtitle, Title } from '../../src/components/ui';
import { useFinance } from '../../src/context/FinanceContext';
import {
  formatDate,
  formatMoney,
  formatTime,
  getCategoryLabel,
  typeLabel,
} from '../../src/lib/categories';
import { colors, radius, spacing } from '../../src/theme';
import { useMemo, useState } from 'react';
import type { TransactionType } from '../../src/types/finance';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state } = useFinance();
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');

  const data = useMemo(() => {
    if (filter === 'all') return state.transactions;
    return state.transactions.filter((t) => t.type === filter);
  }, [state.transactions, filter]);

  return (
    <Screen style={{ paddingTop: insets.top + 8 }}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Title>Movimientos</Title>
          <Subtitle>Tocá uno para ver día, hora y detalle.</Subtitle>
        </View>
        <View style={styles.headActions}>
          <Pressable
            style={styles.catsBtn}
            onPress={() => router.push('/manage-categories')}
          >
            <Ionicons name="pricetags-outline" size={18} color={colors.accent} />
            <Text style={styles.catsBtnText}>Categorías</Text>
          </Pressable>
          <PrimaryButton
            label="+ Semana"
            onPress={() =>
              router.push({
                pathname: '/add-transaction',
                params: { type: 'gasto' },
              })
            }
          />
        </View>
      </View>

      <View style={styles.filters}>
        <Chip label="Todos" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip
          label="Gasto"
          active={filter === 'gasto'}
          onPress={() => setFilter('gasto')}
        />
        <Chip
          label="Ingreso"
          active={filter === 'giro'}
          onPress={() => setFilter('giro')}
        />
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 48, gap: 10, flexGrow: 1 }}
        showsVerticalScrollIndicator
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={36} color={colors.textDim} />
            <Text style={styles.emptyText}>No hay movimientos todavía.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              router.push({
                pathname: '/transaction/[id]',
                params: { id: item.id },
              })
            }
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    item.type === 'giro'
                      ? colors.income
                      : item.type === 'gasto'
                        ? colors.expense
                        : colors.warning,
                },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.cat}>
                {typeLabel(item.type)} · {getCategoryLabel(item.type, item.category)}
              </Text>
              <Text style={styles.meta}>
                {formatDate(item.date)} · {formatTime(item.time, item.createdAt)}
                {item.note ? ` · ${item.note}` : ''}
              </Text>
            </View>
            <Text
              style={[
                styles.amount,
                {
                  color:
                    item.type === 'giro'
                      ? colors.income
                      : item.type === 'gasto'
                        ? colors.expense
                        : colors.warning,
                },
              ]}
            >
              {item.type === 'giro' ? '+' : '-'}
              {formatMoney(item.amount)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: spacing.md,
  },
  headActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  catsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  catsBtnText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 13,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cat: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 14,
  },
  meta: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 3,
  },
  amount: {
    fontWeight: '700',
    fontSize: 15,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'DMSans_400Regular',
    color: colors.textMuted,
  },
});
