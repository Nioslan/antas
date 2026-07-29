import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Alert,
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
  monthKey,
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
import { analyzeAllocation } from '../../src/lib/allocation';
import { buildBudgetRows, budgetTotals } from '../../src/lib/budgets';
import { computeHealthScore } from '../../src/lib/healthScore';
import {
  notifyWeeklyReportNow,
  scheduleWeeklyReportNotification,
} from '../../src/lib/notifications';
import { projectMonthEnd } from '../../src/lib/projection';
import { buildSmartAlerts } from '../../src/lib/smartAlerts';
import { buildWeeklyReport } from '../../src/lib/weeklyReport';
import { useTheme } from '../../src/context/SettingsContext';
import { spacing, type ThemeColors } from '../../src/theme';

const PERIODS: Period[] = ['day', 'week', 'month', 'year'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { ready, state, dismissAlert, markWeeklyReportGenerated } = useFinance();

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

  const health = useMemo(() => computeHealthScore(state), [state]);
  const projection = useMemo(() => projectMonthEnd(state), [state]);
  const allocation = useMemo(() => analyzeAllocation(state), [state]);
  const alerts = useMemo(() => buildSmartAlerts(state), [state]);
  const budgetAlert = useMemo(() => {
    const totals = budgetTotals(buildBudgetRows(state, monthKey()));
    if (totals.overCount > 0) return `${totals.overCount} al límite`;
    if (totals.warnCount > 0) return `${totals.warnCount} cerca`;
    return null;
  }, [state]);
  const healthTone =
    health.tone === 'great'
      ? colors.income
      : health.tone === 'ok'
        ? colors.accent
        : health.tone === 'warn'
          ? colors.warning
          : colors.expense;

  const runWeeklyReport = async () => {
    const report = buildWeeklyReport(state);
    markWeeklyReportGenerated();
    await scheduleWeeklyReportNotification(
      `Libre ${formatMoney(report.weekLibre)}. Abrí la app para el detalle.`
    );
    await notifyWeeklyReportNow(report.title, report.body);
    Alert.alert(report.title, report.body);
  };

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
            <Text style={styles.brand}>Finanzas Personales</Text>
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

        <Pressable
          style={styles.healthCard}
          onPress={() => router.push('/reportes')}
        >
          <View
            style={[
              styles.healthRing,
              { borderColor: healthTone },
            ]}
          >
            <Text style={[styles.healthScore, { color: healthTone }]}>
              {health.score}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.healthTitle}>
              Salud financiera · {health.label}
            </Text>
            <Text style={styles.healthHint}>{health.headline}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
        </Pressable>

        <View style={styles.quickRow}>
          <Pressable
            style={styles.quickBtn}
            onPress={() => router.push('/budgets')}
          >
            <Ionicons name="pie-chart-outline" size={18} color={colors.accent} />
            <Text style={styles.quickText}>Presupuestos</Text>
            {budgetAlert ? (
              <Text style={[styles.quickBadge, { color: colors.expense }]}>
                {budgetAlert}
              </Text>
            ) : null}
          </Pressable>
          <Pressable
            style={styles.quickBtn}
            onPress={() => router.push('/reportes')}
          >
            <Ionicons name="analytics-outline" size={18} color={colors.accent} />
            <Text style={styles.quickText}>Reportes</Text>
          </Pressable>
        </View>

        {alerts.length > 0 ? (
          <View style={{ gap: 8 }}>
            {alerts.slice(0, 3).map((a) => (
              <Pressable
                key={a.id}
                style={[
                  styles.alertCard,
                  {
                    borderColor:
                      a.severity === 'danger'
                        ? colors.expense
                        : a.severity === 'warn'
                          ? colors.warning
                          : colors.border,
                  },
                ]}
                onPress={() => dismissAlert(a.id)}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.alertTitle}>{a.title}</Text>
                  <Text style={styles.alertBody}>{a.body}</Text>
                  <Text style={styles.alertDismiss}>Tocá para ocultar</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Pressable onPress={() => router.push('/reportes')}>
          <Card style={styles.projCard}>
            <Text style={styles.projLabel}>Proyección a fin de mes</Text>
            <Text
              style={[
                styles.projValue,
                {
                  color:
                    projection.projectedLibre >= 0
                      ? colors.income
                      : colors.expense,
                },
              ]}
            >
              {formatMoney(projection.projectedLibre)}
            </Text>
            <Text style={styles.projHint}>{projection.tip}</Text>
          </Card>
        </Pressable>

        <Pressable onPress={() => router.push('/hogar')}>
          <Card style={styles.allocCard}>
            <Text style={styles.projLabel}>
              Regla {Math.round(allocation.rule.needs)}/
              {Math.round(allocation.rule.wants)}/
              {Math.round(allocation.rule.savings)}
            </Text>
            <Text style={styles.allocRow}>
              Necesidades {allocation.needs.pct}% · Gustos {allocation.wants.pct}%
              · Ahorro {allocation.savings.pct}%
            </Text>
            <Text style={styles.projHint}>{allocation.tip}</Text>
          </Card>
        </Pressable>

        <View style={styles.toolsGrid}>
          {(
            [
              { href: '/envelopes', icon: 'wallet-outline' as const, label: 'Sobres' },
              { href: '/deudas', icon: 'card-outline' as const, label: 'Deudas' },
              {
                href: '/calendario',
                icon: 'calendar-outline' as const,
                label: 'Calendario',
              },
              { href: '/reto', icon: 'flame-outline' as const, label: 'Reto' },
            ] as const
          ).map((t) => (
            <Pressable
              key={t.href}
              style={styles.toolBtn}
              onPress={() => router.push(t.href)}
            >
              <Ionicons name={t.icon} size={18} color={colors.accent} />
              <Text style={styles.toolText}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <PrimaryButton
          label="Informe semanal"
          tone="muted"
          onPress={() => void runWeeklyReport()}
        />

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
  healthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bgElevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  healthRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthScore: {
    fontWeight: '800',
    fontSize: 18,
  },
  healthTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  healthHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  quickText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  quickBadge: {
    fontWeight: '700',
    fontSize: 11,
  },
  alertCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
  },
  alertTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  alertBody: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  alertDismiss: { color: colors.textDim, fontSize: 11, marginTop: 4 },
  projCard: { gap: 4 },
  allocCard: { gap: 4 },
  projLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  projValue: { fontWeight: '800', fontSize: 28, letterSpacing: -0.5 },
  projHint: { color: colors.textDim, fontSize: 12, lineHeight: 17 },
  allocRow: { color: colors.text, fontWeight: '600', fontSize: 14 },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolBtn: {
    width: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  toolText: { color: colors.text, fontWeight: '600', fontSize: 13 },
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
