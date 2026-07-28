import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardForm } from '../../src/components/KeyboardForm';
import {
  Card,
  Chip,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../../src/components/ui';
import { useFinance } from '../../src/context/FinanceContext';
import { useSettings } from '../../src/context/SettingsContext';
import { formatMoney } from '../../src/lib/categories';
import {
  clampBonusPercent,
  previewSaturdayBonus,
} from '../../src/lib/saturdayBonus';
import { colors, radius, spacing } from '../../src/theme';

const QUICK = [1, 5, 10, 20, 50, 100];
const PERCENT_PRESETS = [10, 15, 20, 25, 30, 50];

export default function AhorroScreen() {
  const insets = useSafeAreaInsets();
  const { cashNow, adjustCashNow, setCashNow, state } = useFinance();
  const {
    settings,
    setSaturdayBonusEnabled,
    setSaturdayBonusPercent,
  } = useSettings();
  const [amount, setAmount] = useState('10');
  const [setValue, setSetValue] = useState('');
  const [customPercent, setCustomPercent] = useState(
    String(settings.saturdayBonusPercent)
  );

  const percent = settings.saturdayBonusPercent;
  const enabled = settings.saturdayBonusEnabled;

  const preview = useMemo(
    () => previewSaturdayBonus(state, percent),
    [state, percent]
  );

  const parsed = Number(amount.replace(',', '.'));
  const valid = Number.isFinite(parsed) && parsed > 0;

  const applyCustomPercent = () => {
    const n = Number(customPercent.replace(',', '.'));
    if (!Number.isFinite(n)) return;
    const next = clampBonusPercent(n);
    setSaturdayBonusPercent(next);
    setCustomPercent(String(next));
  };

  return (
    <Screen style={{ paddingTop: insets.top + 8 }}>
      <KeyboardForm contentContainerStyle={styles.content} bottomOffset={80}>
        <Text style={styles.brand}>Ahorro</Text>
        <Title>Tu plata actual</Title>
        <Subtitle>
          Subí o bajá el monto a tu voluntad. Si activás el bono, los sábados se
          suma un porcentaje de la ganancia libre de la semana.
        </Subtitle>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Tengo en ahorro</Text>
          <Text
            style={[
              styles.heroAmount,
              { color: cashNow >= 0 ? colors.income : colors.expense },
            ]}
          >
            {formatMoney(cashNow)}
          </Text>
        </View>

        <Card style={styles.bonusCard}>
          <View style={styles.bonusHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bonusTitle}>Bono del sábado</Text>
              <Text style={styles.bonusBody}>
                {enabled
                  ? `Activo · ${percent}% del libre semanal`
                  : 'Apagado · no se suma nada el sábado'}
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setSaturdayBonusEnabled}
              trackColor={{ true: colors.accent, false: colors.border }}
            />
          </View>

          {enabled ? (
            <>
              <Text style={styles.percentLabel}>Porcentaje</Text>
              <View style={styles.quick}>
                {PERCENT_PRESETS.map((n) => (
                  <Chip
                    key={n}
                    label={`${n}%`}
                    active={percent === n}
                    onPress={() => {
                      setSaturdayBonusPercent(n);
                      setCustomPercent(String(n));
                    }}
                  />
                ))}
              </View>
              <View style={styles.customRow}>
                <TextInput
                  style={[styles.input, styles.percentInput]}
                  value={customPercent}
                  onChangeText={setCustomPercent}
                  keyboardType="number-pad"
                  placeholder="20"
                  placeholderTextColor={colors.textDim}
                  maxLength={3}
                />
                <PrimaryButton
                  label="Usar %"
                  tone="muted"
                  onPress={applyCustomPercent}
                />
              </View>

              <Text style={styles.bonusBody}>
                Ganancia libre de esta semana: {formatMoney(preview.weekLibre)}
              </Text>
              <Text style={styles.bonusBody}>
                {percent}% que se suma a Ahorro: {formatMoney(preview.bonus)}
              </Text>
              <Text style={styles.bonusMeta}>
                {preview.alreadyApplied
                  ? 'Ya se aplicó el bono de esta semana.'
                  : `Se aplica al abrir la app el sábado ${preview.saturday} (o el domingo).`}
              </Text>
            </>
          ) : (
            <Text style={styles.bonusMeta}>
              Activá el interruptor si querés que cada sábado se sume un % de lo
              que te quedó libre en la semana.
            </Text>
          )}
        </Card>

        <View style={styles.controls}>
          <Pressable
            style={[styles.bigBtn, styles.minusBtn]}
            onPress={() => valid && adjustCashNow(-parsed)}
            disabled={!valid}
          >
            <Ionicons name="remove" size={36} color={colors.white} />
            <Text style={styles.bigBtnText}>Bajar</Text>
          </Pressable>
          <Pressable
            style={[styles.bigBtn, styles.plusBtn]}
            onPress={() => valid && adjustCashNow(parsed)}
            disabled={!valid}
          >
            <Ionicons name="add" size={36} color={colors.bg} />
            <Text style={[styles.bigBtnText, { color: colors.bg }]}>Subir</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Monto a sumar / restar</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="10"
          placeholderTextColor={colors.textDim}
        />

        <View style={styles.quick}>
          {QUICK.map((n) => (
            <Chip
              key={n}
              label={`$${n}`}
              active={parsed === n}
              onPress={() => setAmount(String(n))}
            />
          ))}
        </View>

        <Card style={styles.setCard}>
          <Text style={styles.setTitle}>O poné el total exacto</Text>
          <TextInput
            style={styles.input}
            value={setValue}
            onChangeText={setSetValue}
            keyboardType="decimal-pad"
            placeholder="Ej: 250"
            placeholderTextColor={colors.textDim}
          />
          <PrimaryButton
            label="Fijar este monto"
            tone="muted"
            onPress={() => {
              const v = Number(setValue.replace(',', '.'));
              if (!Number.isFinite(v)) return;
              setCashNow(v);
              setSetValue('');
            }}
          />
        </Card>
      </KeyboardForm>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  brand: {
    fontWeight: '700',
    color: colors.accent,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  hero: {
    backgroundColor: colors.bgElevated,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  heroLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  heroAmount: {
    fontWeight: '700',
    fontSize: 48,
    letterSpacing: -1,
  },
  bonusCard: {
    gap: 8,
  },
  bonusHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  bonusTitle: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 15,
  },
  bonusBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  bonusMeta: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
  },
  percentLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  percentInput: {
    width: 88,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  bigBtn: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  minusBtn: {
    backgroundColor: colors.expense,
  },
  plusBtn: {
    backgroundColor: colors.accent,
  },
  bigBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quick: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setCard: {
    gap: 12,
  },
  setTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
});
