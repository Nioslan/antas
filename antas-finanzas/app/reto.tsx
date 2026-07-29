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
import { formatMoney, todayKey } from '../src/lib/categories';
import { shiftWeek, toIso } from '../src/lib/periods';
import { weekSpend } from '../src/lib/projection';
import type { ChallengeType } from '../src/types/finance';
import { spacing, type ThemeColors } from '../src/theme';

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return toIso(dt);
}

export default function RetoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    state,
    addChallenge,
    setChallengeActive,
    removeChallenge,
  } = useFinance();

  const [type, setType] = useState<ChallengeType>('spend_less_week');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');

  const today = todayKey();
  const prevSpend = weekSpend(state.transactions, shiftWeek(today, -1));

  const challenges = state.challenges ?? [];

  const onCreate = () => {
    const t = Number(String(target).replace(',', '.'));
    if (type === 'spend_less_week') {
      const limit = Number.isFinite(t) && t > 0 ? t : prevSpend > 0 ? prevSpend * 0.9 : 0;
      if (limit <= 0) {
        Alert.alert(
          'Reto',
          'Cargá gastos de la semana pasada o poné un tope manual.'
        );
        return;
      }
      addChallenge({
        type,
        title: title.trim() || 'Gastar menos que la semana pasada',
        targetAmount: Math.round(limit * 100) / 100,
        startDate: today,
        endDate: addDays(today, 6),
        baselineSpend: prevSpend,
      });
    } else {
      if (!Number.isFinite(t) || t <= 0) {
        Alert.alert('Meta', 'Poné cuánto querés juntar.');
        return;
      }
      addChallenge({
        type,
        title: title.trim() || `Juntar ${formatMoney(t)} en 30 días`,
        targetAmount: t,
        startDate: today,
        endDate: addDays(today, 29),
      });
    }
    setTitle('');
    setTarget('');
  };

  return (
    <Screen style={{ paddingTop: insets.top + 8 }}>
      <KeyboardForm contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Title>Reto de ahorro</Title>
            <Subtitle>
              Una meta corta con racha: gastar menos o juntar una plata en 30
              días.
            </Subtitle>
          </View>
        </View>

        <Card style={{ gap: 8 }}>
          <View style={styles.chips}>
            <Chip
              label="Menos gasto"
              active={type === 'spend_less_week'}
              onPress={() => setType('spend_less_week')}
            />
            <Chip
              label="Juntar plata"
              active={type === 'save_amount'}
              onPress={() => setType('save_amount')}
            />
          </View>
          <Text style={styles.hint}>
            {type === 'spend_less_week'
              ? `Semana pasada gastaste ${formatMoney(prevSpend)}. El reto sugiere ~10% menos.`
              : 'Definí cuánto querés juntar en Ahorro en 30 días.'}
          </Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Nombre del reto (opcional)"
            placeholderTextColor={colors.textDim}
          />
          <TextInput
            style={styles.input}
            value={target}
            onChangeText={setTarget}
            keyboardType="decimal-pad"
            placeholder={
              type === 'spend_less_week'
                ? 'Tope de gasto semanal'
                : 'Meta de ahorro'
            }
            placeholderTextColor={colors.textDim}
          />
          <PrimaryButton label="Empezar reto" onPress={onCreate} />
        </Card>

        {challenges.length === 0 ? (
          <Card>
            <Text style={styles.empty}>No hay retos activos.</Text>
          </Card>
        ) : (
          challenges.map((c) => {
            const spent = weekSpend(state.transactions, today);
            const progress =
              c.type === 'spend_less_week'
                ? c.targetAmount > 0
                  ? Math.min(100, (spent / c.targetAmount) * 100)
                  : 0
                : c.targetAmount > 0
                  ? Math.min(
                      100,
                      ((state.cashNow > 0 ? Math.min(state.cashNow, c.targetAmount) : 0) /
                        c.targetAmount) *
                        100
                    )
                  : 0;
            const ok =
              c.type === 'spend_less_week'
                ? spent <= c.targetAmount
                : state.cashNow >= c.targetAmount;
            return (
              <Card key={c.id} style={{ gap: 8 }}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowTitle}>{c.title}</Text>
                  <Text
                    style={{
                      color: c.active
                        ? ok
                          ? colors.income
                          : colors.warning
                        : colors.textDim,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    {c.active ? (ok ? 'En curso' : 'Ajustá') : 'Pausado'}
                  </Text>
                </View>
                <Text style={styles.meta}>
                  {c.startDate} → {c.endDate}
                  {c.type === 'spend_less_week'
                    ? ` · gasto semana ${formatMoney(spent)} / ${formatMoney(c.targetAmount)}`
                    : ` · meta ${formatMoney(c.targetAmount)} · Ahorro ${formatMoney(state.cashNow)}`}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${progress}%`,
                        backgroundColor:
                          c.type === 'spend_less_week'
                            ? spent > c.targetAmount
                              ? colors.expense
                              : colors.accent
                            : colors.income,
                      },
                    ]}
                  />
                </View>
                <View style={styles.actions}>
                  <Pressable onPress={() => setChallengeActive(c.id, !c.active)}>
                    <Text style={{ color: colors.accent, fontWeight: '700' }}>
                      {c.active ? 'Pausar' : 'Reactivar'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Borrar reto', '¿Sacar este reto?', [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Borrar',
                          style: 'destructive',
                          onPress: () => removeChallenge(c.id),
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
            );
          })
        )}
      </KeyboardForm>
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
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    hint: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
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
    rowTitle: { color: colors.text, fontWeight: '700', fontSize: 15, flex: 1 },
    meta: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
    barTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 4 },
    actions: { flexDirection: 'row', gap: 16 },
  });
}
