import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardForm } from '../src/components/KeyboardForm';
import { Field, PrimaryButton, Screen, Title } from '../src/components/ui';
import { useFinance } from '../src/context/FinanceContext';
import { colors, spacing } from '../src/theme';

export default function AddGoalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addGoal } = useFinance();

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [deadline, setDeadline] = useState('');

  const onSave = () => {
    const targetAmount = Number(target.replace(',', '.'));
    const currentAmount = Number(current.replace(',', '.')) || 0;
    if (!name.trim() || !targetAmount || targetAmount <= 0) return;
    addGoal({
      name,
      targetAmount,
      currentAmount,
      deadline: deadline || undefined,
    });
    router.back();
  };

  return (
    <Screen style={{ paddingTop: insets.top + 12 }}>
      <KeyboardForm contentContainerStyle={styles.content} bottomOffset={40}>
        <View style={styles.head}>
          <Title>Nueva meta</Title>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancel}>Cerrar</Text>
          </Pressable>
        </View>

        <Field
          label="Nombre"
          value={name}
          onChangeText={setName}
          placeholder="Ej: Fondo de emergencia"
        />
        <Field
          label="Monto objetivo"
          value={target}
          onChangeText={setTarget}
          keyboardType="decimal-pad"
          placeholder="1000"
        />
        <Field
          label="Ya ahorrado"
          value={current}
          onChangeText={setCurrent}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        <Field
          label="Fecha límite (opcional)"
          value={deadline}
          onChangeText={setDeadline}
          placeholder="2026-12-31"
        />

        <PrimaryButton label="Crear meta" onPress={onSave} />
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
    fontFamily: 'DMSans_500Medium',
    color: colors.textMuted,
  },
});
