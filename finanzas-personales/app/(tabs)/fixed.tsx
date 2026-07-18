import { useMemo } from 'react';
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
import { formatMoney, getCategoryLabel } from '../../src/lib/categories';
import {
  daysUntilPayUnlock,
  isPayButtonLocked,
  nextDueDate,
  upcomingFixed,
} from '../../src/lib/fixedExpenses';
import { ensureNotificationPermissions } from '../../src/lib/notifications';
import { colors, radius, spacing } from '../../src/theme';

export default function FixedExpensesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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

  const enableAlerts = async () => {
    const ok = await ensureNotificationPermissions();
    await refreshFixedReminders();
    Alert.alert(
      ok ? 'Avisos activos' : 'Permiso pendiente',
      ok
        ? 'Te aviso 5 días antes y el mismo día de cada pago fijo.'
        : 'Activá las notificaciones en Ajustes del celular para recibir avisos.'
    );
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
              Te aviso 5 días antes y el mismo día. Tocá Pagar para registrarlo;
              queda en Pagado 5 días y después vuelve a activarse.
            </Subtitle>
          </View>
        </View>

        <PrimaryButton label="+ Agregar fijo" onPress={() => router.push('/add-fixed')} />
        <PrimaryButton
          label="Activar avisos (5 días y el día)"
          tone="muted"
          onPress={enableAlerts}
        />

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

            return (
              <Card key={f.id} style={styles.card}>
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
                    El botón se reactivará en {unlockIn} día{unlockIn === 1 ? '' : 's'}.
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
