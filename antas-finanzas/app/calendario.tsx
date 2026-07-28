import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PeriodCalendar } from '../src/components/PeriodCalendar';
import {
  Card,
  Screen,
  Subtitle,
  Title,
} from '../src/components/ui';
import { useFinance } from '../src/context/FinanceContext';
import { useTheme } from '../src/context/SettingsContext';
import { formatMoney, todayKey } from '../src/lib/categories';
import {
  buildMonthMoneyEvents,
  eventsForDay,
} from '../src/lib/moneyCalendar';
import { shiftPeriod } from '../src/lib/periods';
import { spacing, type ThemeColors } from '../src/theme';

export default function CalendarioScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { state } = useFinance();
  const [anchor, setAnchor] = useState(todayKey());
  const [selected, setSelected] = useState(todayKey());

  const events = useMemo(
    () => buildMonthMoneyEvents(state, anchor),
    [state, anchor]
  );
  const marked = useMemo(() => events.map((e) => e.date), [events]);
  const dayEvents = useMemo(
    () => eventsForDay(events, selected),
    [events, selected]
  );

  const monthOut = dayEvents
    .filter((e) => e.kind !== 'income_hint')
    .reduce((a, e) => a + e.amount, 0);
  const monthIn = dayEvents
    .filter((e) => e.kind === 'income_hint')
    .reduce((a, e) => a + e.amount, 0);

  return (
    <Screen style={{ paddingTop: insets.top + 8 }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Title>Calendario de plata</Title>
            <Subtitle>
              Sueldos, fijos y cuotas del mes en un solo almanaque.
            </Subtitle>
          </View>
        </View>

        <View style={styles.nav}>
          <Pressable
            style={styles.navBtn}
            onPress={() => {
              const next = shiftPeriod('month', anchor, -1);
              setAnchor(next);
              setSelected(next);
            }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.navLabel}>
            {new Date(anchor + 'T12:00:00').toLocaleDateString('es-ES', {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <Pressable
            style={styles.navBtn}
            onPress={() => {
              const next = shiftPeriod('month', anchor, 1);
              setAnchor(next);
              setSelected(next);
            }}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>

        <PeriodCalendar
          period="month"
          selected={selected}
          markedDates={marked}
          onSelect={setSelected}
        />

        <Card style={{ gap: 6 }}>
          <Text style={styles.dayTitle}>
            {new Date(selected + 'T12:00:00').toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
          {dayEvents.length === 0 ? (
            <Text style={styles.empty}>Nada cargado este día.</Text>
          ) : (
            dayEvents.map((e) => (
              <View key={e.id} style={styles.eventRow}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        e.kind === 'income_hint'
                          ? colors.income
                          : e.kind === 'debt'
                            ? colors.warning
                            : colors.expense,
                    },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{e.title}</Text>
                  {e.subtitle ? (
                    <Text style={styles.eventSub}>{e.subtitle}</Text>
                  ) : null}
                </View>
                <Text
                  style={{
                    fontWeight: '700',
                    color:
                      e.kind === 'income_hint' ? colors.income : colors.expense,
                  }}
                >
                  {e.kind === 'income_hint' ? '+' : '-'}
                  {formatMoney(e.amount)}
                </Text>
              </View>
            ))
          )}
          {dayEvents.length > 0 ? (
            <Text style={styles.summary}>
              Día · ingresos {formatMoney(monthIn)} · salidas{' '}
              {formatMoney(monthOut)}
            </Text>
          ) : null}
        </Card>
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
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    dayTitle: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 16,
      textTransform: 'capitalize',
    },
    empty: { color: colors.textMuted, lineHeight: 22 },
    eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    eventTitle: { color: colors.text, fontWeight: '600', fontSize: 14 },
    eventSub: { color: colors.textDim, fontSize: 12 },
    summary: { color: colors.textDim, fontSize: 12, marginTop: 4 },
  });
}
