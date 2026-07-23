import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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
import { useSettings } from '../src/context/SettingsContext';
import {
  defaultCategory,
  hhmmToTime12,
  nowTimeKey,
  time12ToHhmm,
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
  const { addTransaction, state } = useFinance();
  const { gastoCategories, giroCategories } = useSettings();

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
  const [receiptUri, setReceiptUri] = useState<string | undefined>();
  const [memberId, setMemberId] = useState<string | undefined>();
  const [envelopeId, setEnvelopeId] = useState<string | undefined>();

  const categories = type === 'gasto' ? gastoCategories : giroCategories;
  const members = state.householdMembers ?? [];
  const envelopes = state.envelopes ?? [];
  const time12 = useMemo(() => hhmmToTime12(time), [time]);
  const weekLabel = formatWeekLabel(weekAnchor);
  const { start, end } = getWeekRange(weekAnchor);

  const switchType = (next: TransactionType) => {
    setType(next);
    setCategory(defaultCategory(next));
  };

  const patchTime12 = (patch: Partial<typeof time12>) => {
    setTime(time12ToHhmm({ ...time12, ...patch }));
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
      receiptUri,
      memberId,
      envelopeId: type === 'gasto' ? envelopeId : undefined,
    });
    router.back();
  };

  const pickReceipt = async () => {
    try {
      // Import diferido: no tumba el arranque si el APK viejo no trae el módulo nativo.
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permiso',
          'Necesitamos acceso a tus fotos para adjuntar el ticket.'
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.35,
        base64: true,
        allowsEditing: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.base64) {
        const uri = `data:image/jpeg;base64,${asset.base64}`;
        if (uri.length > 900_000) {
          Alert.alert(
            'Foto grande',
            'Elegí una imagen más chica o recortá el ticket.'
          );
          return;
        }
        setReceiptUri(uri);
      } else if (asset.uri) {
        setReceiptUri(asset.uri);
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
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
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/manage-categories',
              params: { type: type === 'giro' ? 'giro' : 'gasto' },
            })
          }
          style={styles.manageCats}
        >
          <Text style={styles.manageCatsText}>
            Cambiar o agregar categorías
          </Text>
        </Pressable>

        <Text style={styles.label}>Hora</Text>
        <View style={styles.timeRow}>
          <TextInput
            value={String(time12.hour)}
            onChangeText={(raw) => {
              const n = Number(raw.replace(/\D/g, '').slice(0, 2));
              if (!raw.trim()) {
                patchTime12({ hour: 12 });
                return;
              }
              if (!Number.isFinite(n)) return;
              patchTime12({ hour: Math.min(12, Math.max(1, n)) });
            }}
            keyboardType="number-pad"
            style={styles.timeInput}
            maxLength={2}
          />
          <Text style={styles.timeColon}>:</Text>
          <TextInput
            value={String(time12.minute).padStart(2, '0')}
            onChangeText={(raw) => {
              const digits = raw.replace(/\D/g, '').slice(0, 2);
              if (!digits) {
                patchTime12({ minute: 0 });
                return;
              }
              const n = Number(digits);
              if (!Number.isFinite(n)) return;
              patchTime12({ minute: Math.min(59, Math.max(0, n)) });
            }}
            keyboardType="number-pad"
            style={styles.timeInput}
            maxLength={2}
          />
          <Chip
            label="a. m."
            active={time12.period === 'AM'}
            onPress={() => patchTime12({ period: 'AM' })}
          />
          <Chip
            label="p. m."
            active={time12.period === 'PM'}
            onPress={() => patchTime12({ period: 'PM' })}
          />
        </View>

        <Field
          label="Nota / en qué (opcional)"
          value={note}
          onChangeText={setNote}
          placeholder="Ej: supermercado, sueldo, gasolina…"
          returnKeyType="done"
        />

        {type === 'gasto' && envelopes.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.hint}>Sobre (opcional)</Text>
            <View style={styles.wrap}>
              <Chip
                label="Ninguno"
                active={!envelopeId}
                onPress={() => setEnvelopeId(undefined)}
              />
              {envelopes.map((e) => (
                <Chip
                  key={e.id}
                  label={e.name}
                  active={envelopeId === e.id}
                  onPress={() => setEnvelopeId(e.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {members.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.hint}>Quién (hogar)</Text>
            <View style={styles.wrap}>
              <Chip
                label="Nadie"
                active={!memberId}
                onPress={() => setMemberId(undefined)}
              />
              {members.map((m) => (
                <Chip
                  key={m.id}
                  label={m.name}
                  active={memberId === m.id}
                  onPress={() => setMemberId(m.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ gap: 8 }}>
          <PrimaryButton
            label={receiptUri ? 'Cambiar foto del ticket' : 'Adjuntar ticket'}
            tone="muted"
            onPress={() => void pickReceipt()}
          />
          {receiptUri ? (
            <View style={{ gap: 8 }}>
              <Image
                source={{ uri: receiptUri }}
                style={styles.receipt}
                resizeMode="cover"
              />
              <Pressable onPress={() => setReceiptUri(undefined)}>
                <Text style={styles.cancel}>Quitar foto</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

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
  manageCats: {
    marginTop: -4,
    alignSelf: 'flex-start',
  },
  manageCatsText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeInput: {
    width: 56,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  timeColon: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 18,
  },
  receipt: {
    width: '100%',
    height: 160,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
  },
});
