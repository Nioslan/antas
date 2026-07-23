import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Card,
  Chip,
  Screen,
  Subtitle,
  Title,
} from '../src/components/ui';
import { useFinance } from '../src/context/FinanceContext';
import { useTheme } from '../src/context/SettingsContext';
import { formatMoney, todayKey } from '../src/lib/categories';
import { computeHealthScore } from '../src/lib/healthScore';
import {
  formatPeriodLabel,
  periodTitle,
  shiftPeriod,
  type Period,
} from '../src/lib/periods';
import { buildFinanceReport } from '../src/lib/reports';
import { spacing, type ThemeColors } from '../src/theme';

const PERIODS: Period[] = ['week', 'month', 'year'];

export default function ReportesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { state } = useFinance();

  const [period, setPeriod] = useState<Period>('month');
  const [anchor, setAnchor] = useState(todayKey());

  const report = useMemo(
    () => buildFinanceReport(state, period, anchor),
    [state, period, anchor]
  );
  const health = useMemo(() => computeHealthScore(state), [state]);
  const maxTrend = Math.max(
    1,
    ...report.trendMonths.flatMap((p) => [p.ingreso, p.gasto])
  );

  const toneColor =
    health.tone === 'great'
      ? colors.income
      : health.tone === 'ok'
        ? colors.accent
        : health.tone === 'warn'
          ? colors.warning
          : colors.expense;

  return (
    <Screen style={{ paddingTop: insets.top + 8 }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.head}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Title>Reportes</Title>
            <Subtitle>
              Compará períodos, mirá categorías top y tu score de salud
              financiera.
            </Subtitle>
          </View>
        </View>

        <Card style={styles.health}>
          <View style={styles.healthTop}>
            <View
              style={[
                styles.scoreRing,
                { borderColor: toneColor },
              ]}
            >
              <Text style={[styles.scoreNum, { color: toneColor }]}>
                {health.score}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.healthLabel}>{health.label}</Text>
              <Text style={styles.healthHeadline}>{health.headline}</Text>
            </View>
          </View>
          {health.factors.map((f) => (
            <View key={f.id} style={styles.factor}>
              <View style={styles.factorTop}>
                <Text style={styles.factorLabel}>{f.label}</Text>
                <Text style={styles.factorScore}>{f.score}</Text>
              </View>
              <Text style={styles.factorTip}>{f.tip}</Text>
            </View>
          ))}
        </Card>

        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <Chip
              key={p}
              label={periodTitle(p)}
              active={period === p}
              onPress={() => setPeriod(p)}
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
          <Text style={styles.navLabel}>{formatPeriodLabel(period, anchor)}</Text>
          <Pressable
            style={styles.navBtn}
            onPress={() => setAnchor((a) => shiftPeriod(period, a, 1))}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          <Card style={styles.gridCard}>
            <Text style={styles.gridLabel}>Libre</Text>
            <Text
              style={[
                styles.gridValue,
                {
                  color:
                    report.current.libre >= 0 ? colors.income : colors.expense,
                },
              ]}
            >
              {formatMoney(report.current.libre)}
            </Text>
            <Text style={styles.delta}>
              {report.deltaLibre >= 0 ? '+' : ''}
              {formatMoney(report.deltaLibre)} vs período anterior
            </Text>
          </Card>
          <Card style={styles.gridCard}>
            <Text style={styles.gridLabel}>Gastos</Text>
            <Text style={[styles.gridValue, { color: colors.expense }]}>
              {formatMoney(report.current.gasto)}
            </Text>
            <Text style={styles.delta}>
              {report.deltaGastoPct == null
                ? 'Sin base anterior'
                : `${report.deltaGastoPct >= 0 ? '+' : ''}${report.deltaGastoPct}% vs anterior`}
            </Text>
          </Card>
        </View>

        <Card style={{ gap: 6 }}>
          <Text style={styles.section}>Resumen</Text>
          <Text style={styles.meta}>
            Ingresos {formatMoney(report.current.giro)} · {report.txCount}{' '}
            movimientos
          </Text>
          <Text style={styles.meta}>
            Ticket promedio de gasto{' '}
            {formatMoney(report.avgTicketGasto)}
          </Text>
        </Card>

        <Text style={styles.section}>Tendencia 6 meses</Text>
        <Card style={styles.trendCard}>
          <View style={styles.trendRow}>
            {report.trendMonths.map((p) => (
              <View key={p.key} style={styles.trendCol}>
                <View style={styles.bars}>
                  <View
                    style={[
                      styles.barIn,
                      {
                        height: Math.max(4, (p.ingreso / maxTrend) * 72),
                        backgroundColor: colors.income,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.barOut,
                      {
                        height: Math.max(4, (p.gasto / maxTrend) * 72),
                        backgroundColor: colors.expense,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.trendLabel}>{p.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.legend}>
            Verde = ingresos · Rojo = gastos
          </Text>
        </Card>

        <Text style={styles.section}>Top gastos</Text>
        {report.topExpenses.length === 0 ? (
          <Card>
            <Text style={styles.empty}>Sin gastos en este período.</Text>
          </Card>
        ) : (
          report.topExpenses.map((row) => (
            <Card key={row.category} style={styles.catRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.catLabel}>{row.label}</Text>
                <View style={styles.miniTrack}>
                  <View
                    style={[
                      styles.miniFill,
                      {
                        width: `${Math.min(100, row.share)}%` as `${number}%`,
                        backgroundColor: colors.expense,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.catAmount}>{formatMoney(row.amount)}</Text>
                <Text style={styles.catShare}>{Math.round(row.share)}%</Text>
              </View>
            </Card>
          ))
        )}

        <Text style={styles.section}>Top ingresos</Text>
        {report.topIncomes.length === 0 ? (
          <Card>
            <Text style={styles.empty}>Sin ingresos en este período.</Text>
          </Card>
        ) : (
          report.topIncomes.map((row) => (
            <Card key={row.category} style={styles.catRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.catLabel}>{row.label}</Text>
                <View style={styles.miniTrack}>
                  <View
                    style={[
                      styles.miniFill,
                      {
                        width: `${Math.min(100, row.share)}%` as `${number}%`,
                        backgroundColor: colors.income,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.catAmount, { color: colors.income }]}>
                  {formatMoney(row.amount)}
                </Text>
                <Text style={styles.catShare}>{Math.round(row.share)}%</Text>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
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
    health: { gap: 12 },
    healthTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
    scoreRing: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg,
    },
    scoreNum: { fontSize: 24, fontWeight: '800' },
    healthLabel: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 18,
    },
    healthHeadline: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
    factor: {
      gap: 2,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    factorTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    factorLabel: { color: colors.text, fontWeight: '600', fontSize: 13 },
    factorScore: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
    factorTip: { color: colors.textDim, fontSize: 12, lineHeight: 17 },
    periodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    navLabel: {
      flex: 1,
      textAlign: 'center',
      color: colors.text,
      fontWeight: '600',
      textTransform: 'capitalize',
      fontSize: 14,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridCard: { width: '48%', flexGrow: 1, gap: 4 },
    gridLabel: { color: colors.textMuted, fontSize: 13 },
    gridValue: { fontWeight: '700', fontSize: 20 },
    delta: { color: colors.textDim, fontSize: 11 },
    section: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 16,
      marginTop: 4,
    },
    meta: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
    trendCard: { gap: 10 },
    trendRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 4,
      minHeight: 96,
    },
    trendCol: { flex: 1, alignItems: 'center', gap: 6 },
    bars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 3,
      height: 76,
    },
    barIn: { width: 7, borderRadius: 3 },
    barOut: { width: 7, borderRadius: 3 },
    trendLabel: { color: colors.textDim, fontSize: 11 },
    legend: { color: colors.textDim, fontSize: 11 },
    catRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    catLabel: { color: colors.text, fontWeight: '700', fontSize: 14 },
    miniTrack: {
      marginTop: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    miniFill: { height: '100%', borderRadius: 3 },
    catAmount: { color: colors.text, fontWeight: '700', fontSize: 14 },
    catShare: { color: colors.textDim, fontSize: 11, marginTop: 2 },
    empty: { color: colors.textMuted, lineHeight: 22 },
  });
}
