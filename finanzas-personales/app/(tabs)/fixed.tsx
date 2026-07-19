import { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Card,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../../src/components/ui';
import { useFinance } from '../../src/context/FinanceContext';
import { useSettings } from '../../src/context/SettingsContext';
import { formatMoney, getCategoryLabel } from '../../src/lib/categories';
import {
  daysUntilPayUnlock,
  isPayButtonLocked,
  nextDueDate,
  upcomingFixed,
} from '../../src/lib/fixedExpenses';
import {
  cancelFixedReminders,
  ensureNotificationPermissions,
  listDueSoonBills,
  notifyDueBillsNow,
  scheduleFixedReminders,
  vibrateForBillAlert,
} from '../../src/lib/notifications';
import { colors, radius, spacing } from '../../src/theme';

export default function FixedExpensesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, setNotificationsEnabled } = useSettings();
  const {
    state,
    updateFixedExpense,
    removeFixedExpense,
    payFixedExpense,
    refreshFixedReminders,
  } = useFinance();

  const upcoming = useMemo(
    () => upcomingFixed(state.fixedExpenses, 40),
    [state.fixedExpenses]
  );

  const dueSoon = useMemo(
    () => listDueSoonBills(state.fixedExpenses, undefined, 5),
    [state.fixedExpenses]
  );

  const dueToday = dueSoon.filter((d) => d.days === 0);

  useEffect(() => {
    if (dueSoon.length === 0 || !settings.notificationsEnabled) return;
    // Vibración suave al entrar si hay algo por pagar pronto
    if (dueToday.length > 0) vibrateForBillAlert();
  }, [dueSoon.length, dueToday.length, settings.notificationsEnabled]);

  const onToggleAlerts = async (value: boolean) => {
    if (value) {
      const ok = await ensureNotificationPermissions();
      if (!ok) {
        setNotificationsEnabled(false);
        Alert.alert(
          'Permiso pendiente',
          'Activá las notificaciones en Ajustes del celular para recibir avisos.'
        );
        return;
      }
      setNotificationsEnabled(true);
      await scheduleFixedReminders(state.fixedExpenses);
      await notifyDueBillsNow(state.fixedExpenses, { force: true });
      return;
    }
    setNotificationsEnabled(false);
    await cancelFixedReminders();
  };

  const onPay = (id: string, name: string, amount: number) => {
    const ok = payFixedExpense(id);
    if (ok) {
      void refreshFixedReminders();
      Alert.alert(
        'Pagado',
        `${name} (${formatMoney(amount)}) se sumó a tus gastos. El botón se reactivará en 5 días.`
      );
    }
  };

  return (
    <Screen style={{ paddingTop: insets.top + 8 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
      >
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>Fijos</Text>
            <Title>Gastos fijos</Title>
            <Subtitle>
              Tocá Pagar para registrar un gasto fijo. Podés activar avisos
              afuera de la app (con vibración).
            </Subtitle>
          </View>
        </View>

        <View style={styles.alertsRow}>
          <Ionicons
            name={
              settings.notificationsEnabled
                ? 'notifications'
                : 'notifications-off-outline'
            }
            size={18}
            color={
              settings.notificationsEnabled ? colors.accent : colors.textDim
            }
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertsTitle}>Avisos y notificaciones</Text>
            <Text style={styles.alertsHint}>
              {settings.notificationsEnabled
                ? 'Activos · 5, 3 y 1 día antes, y el día'
                : 'Apagados'}
            </Text>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={onToggleAlerts}
            trackColor={{ true: colors.accent, false: colors.border }}
          />
        </View>

        {dueSoon.length > 0 ? (
          <View style={styles.alertBanner}>
            <Ionicons name="notifications" size={22} color={colors.expense} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>
                {dueToday.length > 0
                  ? `Hoy tenés que pagar ${dueToday.length}`
                  : `${dueSoon.length} pago${dueSoon.length === 1 ? '' : 's'} cerca`}
              </Text>
              <Text style={styles.alertBody}>
                {dueSoon
                  .slice(0, 3)
                  .map(({ bill, days }) => {
                    const when =
                      days === 0
                        ? 'hoy'
                        : days === 1
                          ? 'mañana'
                          : `en ${days} días`;
                    return `${bill.name} (${when})`;
                  })
                  .join(' · ')}
                {dueSoon.length > 3 ? ` · +${dueSoon.length - 3}` : ''}
              </Text>
            </View>
          </View>
        ) : null}

        <PrimaryButton label="+ Agregar fijo" onPress={() => router.push('/add-fixed')} />

        {upcoming.length > 0 && (
          <Card style={styles.upcoming}>
            <Text style={styles.section}>Próximos vencimientos</Text>
            {upcoming.slice(0, 5).map((f) => (
              <Text key={f.id} style={styles.upcomingRow}>
                {f.days === 0
                  ? 'Hoy'
                  : f.days === 1
                    ? 'Mañana'
                    : `En ${f.days} días`}
                : {f.name} · {formatMoney(f.amount)} · pago {f.due}
              </Text>
            ))}
          </Card>
        )}

        {state.fixedExpenses.length === 0 ? (
          <Card>
            <Text style={styles.empty}>
              Agregá tus fijos (Renta, Agua, Luz, Internet…). Cuando toques
              Pagar, se suma al historial de gastos.
            </Text>
          </Card>
        ) : (
          state.fixedExpenses.map((f) => {
            const due = nextDueDate(f.dueDay);
            const learned = f.learnedDays.length >= 2;
            const locked = isPayButtonLocked(f.lastPaidDate, 5);
            const unlockIn = daysUntilPayUnlock(f.lastPaidDate, 5);
            const billDue = dueSoon.find((d) => d.bill.id === f.id);

            return (
              <Card
                key={f.id}
                style={
                  billDue?.days === 0
                    ? { ...styles.card, ...styles.cardDueToday }
                    : styles.card
                }
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{f.name}</Text>
                    <Text style={styles.meta}>
                      {getCategoryLabel('gasto', f.category)} · día {f.dueDay}
                      {learned ? ' · aprendido' : ''}
                    </Text>
                  </View>
                  <Text style={styles.amount}>{formatMoney(f.amount)}</Text>
                </View>
                <Text style={styles.due}>Próximo pago: {due}</Text>
                {billDue ? (
                  <Text style={styles.dueUrgent}>
                    {billDue.days === 0
                      ? '¡Vence hoy!'
                      : billDue.days === 1
                        ? 'Vence mañana'
                        : `Vence en ${billDue.days} días`}
                  </Text>
                ) : null}
                {f.lastPaidDate ? (
                  <Text style={styles.due}>Último pago: {f.lastPaidDate}</Text>
                ) : null}

                <Pressable
                  style={[
                    styles.payBtn,
                    locked ? styles.payBtnPaid : styles.payBtnActive,
                  ]}
                  disabled={locked}
                  onPress={() => onPay(f.id, f.name, f.amount)}
                >
                  <Ionicons
                    name={locked ? 'checkmark-circle' : 'card-outline'}
                    size={20}
                    color={locked ? colors.accent : colors.bg}
                  />
                  <Text
                    style={[
                      styles.payBtnText,
                      locked && { color: colors.accent },
                    ]}
                  >
                    {locked ? 'Pagado' : 'Pagar'}
                  </Text>
                </Pressable>
                {locked ? (
                  <Text style={styles.unlockHint}>
                    El botón se reactivará en {unlockIn} día
                    {unlockIn === 1 ? '' : 's'}.
                  </Text>
                ) : null}

                <View style={styles.row}>
                  <Text style={styles.switchLabel}>Activo / avisos</Text>
                  <Switch
                    value={f.enabled}
                    onValueChange={(v) =>
                      updateFixedExpense(f.id, { enabled: v })
                    }
                    trackColor={{ true: colors.accent, false: colors.border }}
                  />
                </View>

                <Pressable
                  style={styles.deleteBtn}
                  onPress={() =>
                    Alert.alert('Eliminar', `¿Borrar ${f.name}?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: () => removeFixedExpense(f.id),
                      },
                    ])
                  }
                >
                  <Ionicons name="trash-outline" size={18} color={colors.expense} />
                  <Text style={styles.deleteText}>Borrar</Text>
                </Pressable>
              </Card>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: 48,
  },
  head: {
    gap: 4,
  },
  brand: {
    fontWeight: '700',
    color: colors.accent,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  alertsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  alertsTitle: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  alertsHint: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 1,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.expenseSoft,
    borderWidth: 1,
    borderColor: colors.expense,
  },
  alertTitle: {
    color: colors.expense,
    fontWeight: '700',
    fontSize: 15,
  },
  alertBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  upcoming: {
    gap: 6,
  },
  section: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  upcomingRow: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  empty: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  card: {
    gap: 8,
  },
  cardDueToday: {
    borderWidth: 1,
    borderColor: colors.expense,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  name: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
  },
  meta: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    color: colors.expense,
    fontWeight: '700',
    fontSize: 16,
  },
  due: {
    color: colors.textMuted,
    fontSize: 13,
  },
  dueUrgent: {
    color: colors.expense,
    fontWeight: '700',
    fontSize: 13,
  },
  payBtn: {
    marginTop: 4,
    borderRadius: radius.pill,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payBtnActive: {
    backgroundColor: colors.expense,
  },
  payBtnPaid: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  payBtnText: {
    color: colors.bg,
    fontWeight: '700',
    fontSize: 16,
  },
  unlockHint: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  deleteText: {
    color: colors.expense,
    fontWeight: '600',
    fontSize: 13,
  },
});
