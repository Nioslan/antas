import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PeriodCalendar } from '../../src/components/PeriodCalendar';
import {
  Card,
  Chip,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../../src/components/ui';
import { useFinance } from '../../src/context/FinanceContext';
import {
  formatMoney,
  getCategoryLabel,
  todayKey,
  typeLabel,
} from '../../src/lib/categories';
import {
  filterByPeriod,
  formatPeriodLabel,
  periodTitle,
  shiftPeriod,
  summarizePeriod,
  type Period,
} from '../../src/lib/periods';
import { useTheme } from '../../src/context/SettingsContext';
import { spacing, type ThemeColors } from '../../src/theme';

const PERIODS: Period[] = ['day', 'week', 'month', 'year'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { ready, state } = useFinance();

  const [period, setPeriod] = useState<Period>('week');
  const [anchor, setAnchor] = useState(todayKey());
  const [showCalendar, setShowCalendar] = useState(false);

  const summary = useMemo(
    () => summarizePeriod(state.transactions, period, anchor),
    [state.transactions, period, anchor]
  );

  const recent = useMemo(
    () => filterByPeriod(state.transactions, period, anchor).slice(0, 8),
    [state.transactions, period, anchor]
  );

  const markedDates = useMemo(
    () => state.transactions.map((t) => t.date),
    [state.transactions]
  );

  const label = formatPeriodLabel(period, anchor);
  const canAdd = period === 'week' || period === 'day';

  return (
    <Screen style={{ paddingTop: insets.top + 8 }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>Finanzas</Text>
            <Title>Tu dinero</Title>
            <Subtitle>
              Elegí día, semana, mes o año en el almanaque para ver tus
              estadísticas.
            </Subtitle>
          </View>
          <Link href="/settings" asChild>
            <Pressable style={styles.iconBtn}>
              <Ionicons name="settings-outline" size={20} color={colors.text} />
            </Pressable>
          </Link>
        </View>

        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <Chip
              key={p}
              label={periodTitle(p)}
              active={period === p}
              onPress={() => {
                setPeriod(p);
              }}
            />
          ))}
        </View>

        <View style={styles.nav}>
          <Pressable
            style={styles.navBtn}
            onPress={() => setAnchor((a) => shiftPeriod(period, a, -1))}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Pressable
            style={styles.navLabelBtn}
            onPress={() => setShowCalendar((v) => !v)}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={colors.accent}
            />
            <Text style={styles.navLabel}>{label}</Text>
            <Ionicons
              name={showCalendar ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textMuted}
            />
          </Pressable>
          <Pressable
            style={styles.navBtn}
            onPress={() => setAnchor((a) => shiftPeriod(period, a, 1))}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>

        {showCalendar ? (
          <PeriodCalendar
            period={period}
            selected={anchor}
            markedDates={markedDates}
            onSelect={(iso) => {
              setAnchor(iso);
              setShowCalendar(false);
            }}
          />
        ) : null}

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Libre · {periodTitle(period).toLowerCase()}</Text>
          <Text
            style={[
              styles.heroAmount,
              { color: summary.libre >= 0 ? colors.income : colors.expense },
            ]}
          >
            {formatMoney(summary.libre)}
          </Text>
          <Text style={styles.heroHint}>
            Ingresos {formatMoney(summary.giro)} − gastos{' '}
            {formatMoney(summary.gasto + summary.inversion)}
          </Text>
        </View>

        <View style={styles.grid}>
          <Card style={styles.gridCard}>
            <Text style={styles.gridLabel}>Ingresos</Text>
            <Text style={[styles.gridValue, { color: colors.income }]}>
              {formatMoney(summary.giro)}
            </Text>
          </Card>
          <Card style={styles.gridCard}>
            <Text style={styles.gridLabel}>Gastos</Text>
            <Text style={[styles.gridValue, { color: colors.expense }]}>
              {formatMoney(summary.gasto)}
            </Text>
          </Card>
        </View>

        {canAdd ? (
          <View style={styles.actions}>
            <PrimaryButton
              label="+ Gasto"
              tone="expense"
              onPress={() =>
                router.push({
                  pathname: '/add-transaction',
                  params: { type: 'gasto', week: anchor },
                })
              }
            />
            <PrimaryButton
              label="+ Ingreso"
              onPress={() =>
                router.push({
                  pathname: '/add-transaction',
                  params: { type: 'giro', week: anchor },
                })
              }
            />
          </View>
        ) : (
          <Card>
            <Text style={styles.empty}>
              En {periodTitle(period).toLowerCase()} solo consultás. Para cargar
              gastos o ingresos, pasá a Semana.
            </Text>
            <Pressable
              style={{ marginTop: 10 }}
              onPress={() => {
                setPeriod('week');
                setAnchor(todayKey());
              }}
            >
              <Text style={styles.link}>Ir a semana →</Text>
            </Pressable>
          </Card>
        )}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Movimientos</Text>
          <Text style={styles.muted}>{ready ? `${recent.length} vistos` : '…'}</Text>
        </View>

        {recent.length === 0 ? (
          <Card>
            <Text style={styles.empty}>
              No hay movimientos en este período.
              {period === 'week'
                ? ' Cargá un gasto o ingreso de la semana.'
                : ' Cambiá a Semana para cargar.'}
            </Text>
          </Card>
        ) : (
          recent.map((t) => (
            <Pressable
              key={t.id}
              onPress={() =>
                router.push({
                  pathname: '/transaction/[id]',
                  params: { id: t.id },
                })
              }
            >
              <Card style={styles.tx}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txCat}>
                    {typeLabel(t.type)} · {getCategoryLabel(t.type, t.category)}
                  </Text>
                  <Text style={styles.txNote}>
                    {t.date}
                    {t.note ? ` · ${t.note}` : ''}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    {
                      color:
                        t.type === 'giro'
                          ? colors.income
                          : t.type === 'gasto'
                            ? colors.expense
                            : colors.warning,
                    },
                  ]}
                >
                  {t.type === 'giro' ? '+' : '-'}
                  {formatMoney(t.amount)}
                </Text>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  content: {
    paddingBottom: 48,
    gap: spacing.md,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  brand: {
    fontWeight: '700',
    color: colors.accent,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navLabel: {
    textAlign: 'center',
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
    textTransform: 'capitalize',
    flexShrink: 1,
  },
  hero: {
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 6,
  },
  heroLabel: {
    fontWeight: '500',
    color: colors.textMuted,
    fontSize: 14,
  },
  heroAmount: {
    fontWeight: '700',
    fontSize: 40,
    letterSpacing: -1,
  },
  heroHint: {
    color: colors.textDim,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '48%',
    flexGrow: 1,
    gap: 4,
  },
  gridLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  gridValue: {
    fontWeight: '700',
    fontSize: 20,
  },
  actions: {
    gap: 10,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 18,
  },
  muted: {
    color: colors.textDim,
    fontSize: 12,
  },
  link: {
    fontWeight: '700',
    color: colors.accent,
    fontSize: 13,
  },
  empty: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  tx: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txCat: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 14,
  },
  txNote: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontWeight: '700',
    fontSize: 15,
  },
});
}
