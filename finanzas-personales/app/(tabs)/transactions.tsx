import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip, PrimaryButton, Screen, Subtitle, Title } from '../../src/components/ui';
import { useFinance } from '../../src/context/FinanceContext';
import { useTheme } from '../../src/context/SettingsContext';
import {
  formatDate,
  formatMoney,
  formatTime,
  getCategoryLabel,
  typeLabel,
} from '../../src/lib/categories';
import { radius, spacing, type ThemeColors } from '../../src/theme';
import { useMemo, useState } from 'react';
import type { TransactionType } from '../../src/types/finance';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { state } = useFinance();
  const [filter, setFilter] = useState<TransactionType | 'all'>('all');
  const [query, setQuery] = useState('');

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.transactions.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false;
      if (!q) return true;
      const hay = [
        t.note,
        t.category,
        getCategoryLabel(t.type, t.category),
        typeLabel(t.type),
        t.date,
        formatMoney(t.amount),
        String(t.amount),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [state.transactions, filter, query]);

  return (
    <Screen style={{ paddingTop: insets.top + 8 }}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Title>Movimientos</Title>
          <Subtitle>Buscá por nota, categoría, monto o fecha.</Subtitle>
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

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.textDim} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar movimientos…"
          placeholderTextColor={colors.textDim}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textDim} />
          </Pressable>
        ) : null}
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
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={36} color={colors.textDim} />
            <Text style={styles.emptyText}>
              {query
                ? 'Nada coincide con esa búsqueda.'
                : 'No hay movimientos todavía.'}
            </Text>
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
      gap: 4,
    },
    catsBtnText: {
      color: colors.accent,
      fontWeight: '600',
      fontSize: 13,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: spacing.sm,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      padding: 0,
    },
    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: spacing.md,
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      gap: 10,
    },
    emptyText: {
      color: colors.textMuted,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.bgCard,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
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
      marginTop: 2,
    },
    amount: {
      fontWeight: '700',
      fontSize: 15,
    },
  });
}
