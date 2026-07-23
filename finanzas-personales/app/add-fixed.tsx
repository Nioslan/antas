import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
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
import { useSettings } from '../src/context/SettingsContext';
import { FIXED_PRESETS } from '../src/types/fixed';
import { colors, spacing } from '../src/theme';

export default function AddFixedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addFixedExpense } = useFinance();
  const { gastoCategories } = useSettings();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [category, setCategory] = useState('vivienda');

  const onSave = () => {
    const value = Number(amount.replace(',', '.'));
    const day = Number(dueDay);
    if (!name.trim() || !value || value <= 0 || !day || day < 1 || day > 31) {
      return;
    }
    addFixedExpense({
      name: name.trim(),
      amount: value,
      dueDay: day,
      category,
    });
    router.back();
  };

  return (
    <Screen style={{ paddingTop: insets.top + 12 }}>
      <KeyboardForm contentContainerStyle={styles.content} bottomOffset={40}>
        <View style={styles.head}>
          <Title>Nuevo gasto fijo</Title>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancel}>Cerrar</Text>
          </Pressable>
        </View>

        <Text style={styles.hint}>
          Elegí un preset o escribí el tuyo. El día del mes es cuando suele
          pagarse. La app lo va afinando cuando registres ese gasto.
        </Text>

        <Text style={styles.label}>Presets</Text>
        <View style={styles.wrap}>
          {FIXED_PRESETS.map((p) => (
            <Chip
              key={p.name}
              label={p.name}
              active={name === p.name}
              onPress={() => {
                setName(p.name);
                setCategory(p.category);
                setDueDay(String(p.dueDay));
              }}
            />
          ))}
        </View>

        <Field
          label="Nombre"
          value={name}
          onChangeText={setName}
          placeholder="Ej: Renta, Agua, Luz, Internet"
        />
        <Field
          label="Monto aproximado"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="500"
        />
        <Field
          label="Día del mes (1–31)"
          value={dueDay}
          onChangeText={setDueDay}
          keyboardType="number-pad"
          placeholder="1"
        />

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.wrap}>
          {gastoCategories.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              active={category === c.id}
              onPress={() => setCategory(c.id)}
            />
          ))}
        </View>
        <Pressable onPress={() => router.push('/manage-categories')}>
          <Text style={styles.manageCatsText}>
            Cambiar o agregar categorías
          </Text>
        </Pressable>

        <PrimaryButton label="Guardar fijo" onPress={onSave} />
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
  label: {
    fontWeight: '500',
    fontSize: 13,
    color: colors.textMuted,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  manageCatsText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
