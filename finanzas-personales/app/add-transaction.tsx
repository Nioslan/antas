import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardForm } from '../src/components/KeyboardForm';
import {
  Chip,
  Field,
  PrimaryButton,
  Screen,
  Title,
} from '../src/components/ui';
import { useFinance } from '../src/context/FinanceContext';
import {
  defaultCategory,
  getCategories,
  nowTimeKey,
  todayKey,
} from '../src/lib/categories';
import {
  dayNumber,
  daysInWeek,
  formatWeekLabel,
  getWeekRange,
  isDateInWeek,
  shiftWeek,
  weekdayShort,
} from '../src/lib/periods';
import { colors, radius, spacing } from '../src/theme';
import type { Category, TransactionType } from '../src/types/finance';

function parseType(raw?: string | string[]): TransactionType {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'gasto' || value === 'giro' || value === 'inversion') return value;
  return 'gasto';
}

function parseWeek(raw?: string | string[]): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return todayKey();
}

export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; week?: string }>();
  const { addTransaction } = useFinance();

  const initialType = parseType(params.type);
  const addType: TransactionType =
    initialType === 'inversion' ? 'gasto' : initialType;

  const [type, setType] = useState<TransactionType>(addType);
  const [weekAnchor, setWeekAnchor] = useState(parseWeek(params.week));
  const weekDays = useMemo(() => daysInWeek(weekAnchor), [weekAnchor]);
  const [date, setDate] = useState(() => {
    const today = todayKey();
    const days = daysInWeek(parseWeek(params.week));
    return days.includes(today) ? today : days[0];
  });
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(defaultCategory(addType));
  const [note, setNote] = useState('');
  const [time, setTime] = useState(nowTimeKey());

  const categories = getCategories(type);
  const weekLabel = formatWeekLabel(weekAnchor);
  const { start, end } = getWeekRange(weekAnchor);

  const switchType = (next: TransactionType) => {
    setType(next);
    setCategory(defaultCategory(next));
  };

  const moveWeek = (delta: number) => {
    const next = shiftWeek(weekAnchor, delta);
    setWeekAnchor(next);
    const days = daysInWeek(next);
    setDate(days.includes(todayKey()) ? todayKey() : days[0]);
  };

  const onSave = () => {
    const value = Number(amount.replace(',', '.'));
    if (!value || value <= 0) return;

    if (!isDateInWeek(date, weekAnchor)) {
      Alert.alert(
        'Solo por semana',
        'Solo podés cargar movimientos dentro de la semana elegida.'
      );
      return;
    }

    addTransaction({
      type,
      amount: value,
      category,
      note,
      date,
      time: time.trim() || nowTimeKey(),
    });
    router.back();
  };

  return (
    <Screen style={{ paddingTop: insets.top + 12 }}>
      <KeyboardForm contentContainerStyle={styles.content} bottomOffset={40}>
        <View style={styles.head}>
          <Title>Cargar semana</Title>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancel}>Cerrar</Text>
          </Pressable>
        </View>

        <Text style={styles.hint}>
          Elegí la semana, el día, y si es un gasto o un ingreso.
        </Text>

        <View style={styles.weekNav}>
          <Pressable style={styles.navBtn} onPress={() => moveWeek(-1)}>
            <Text style={styles.navTxt}>←</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.weekTitle}>{weekLabel}</Text>
            <Text style={styles.weekRange}>
              {start} → {end}
            </Text>
          </View>
          <Pressable style={styles.navBtn} onPress={() => moveWeek(1)}>
            <Text style={styles.navTxt}>→</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Día de la semana</Text>
        <View style={styles.days}>
          {weekDays.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDate(d)}
              style={[styles.dayChip, date === d && styles.dayChipActive]}
            >
              <Text style={[styles.dayName, date === d && styles.dayActiveText]}>
                {weekdayShort(d)}
              </Text>
              <Text style={[styles.dayNum, date === d && styles.dayActiveText]}>
                {dayNumber(d)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.row}>
          <Chip
            label="Gasto"
            active={type === 'gasto'}
            onPress={() => switchType('gasto')}
          />
          <Chip
            label="Ingreso"
            active={type === 'giro'}
            onPress={() => switchType('giro')}
          />
        </View>

        <Field
          label="Monto"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.wrap}>
          {categories.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              active={category === c.id}
              onPress={() => setCategory(c.id)}
            />
          ))}
        </View>

        <Field
          label="Hora (HH:MM)"
          value={time}
          onChangeText={setTime}
          placeholder={nowTimeKey()}
          keyboardType="numbers-and-punctuation"
        />

        <Field
          label="Nota / en qué (opcional)"
          value={note}
          onChangeText={setNote}
          placeholder="Ej: supermercado, sueldo, gasolina…"
          returnKeyType="done"
        />

        <PrimaryButton
          label="Guardar"
          onPress={onSave}
          tone={type === 'gasto' ? 'expense' : 'accent'}
        />
      </KeyboardForm>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancel: {
    fontWeight: '500',
    color: colors.textMuted,
  },
  hint: {
    color: colors.textMuted,
    lineHeight: 20,
    fontSize: 13,
    marginTop: -4,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTxt: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  weekTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  weekRange: {
    color: colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  label: {
    fontWeight: '500',
    fontSize: 13,
    color: colors.textMuted,
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  dayName: {
    color: colors.textDim,
    fontSize: 10,
    textTransform: 'capitalize',
  },
  dayNum: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 2,
  },
  dayActiveText: {
    color: colors.accent,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
