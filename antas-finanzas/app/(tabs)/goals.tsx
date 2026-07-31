import { useState } from 'react';
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
import { KeyboardForm } from '../../src/components/KeyboardForm';
import { Card, PrimaryButton, Screen, Subtitle, Title } from '../../src/components/ui';
import { useFinance } from '../../src/context/FinanceContext';
import { formatMoney } from '../../src/lib/categories';
import { colors, radius, spacing } from '../../src/theme';

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, contributeToGoal, removeGoal } = useFinance();
  const [contrib, setContrib] = useState<Record<string, string>>({});

  return (
    <Screen style={{ paddingTop: insets.top + 8 }}>
      <KeyboardForm contentContainerStyle={styles.content} bottomOffset={80}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Title>Metas</Title>
            <Subtitle>Ahorro personal con lo que te queda libre.</Subtitle>
          </View>
          <PrimaryButton label="+ Meta" onPress={() => router.push('/add-goal')} />
        </View>

        {state.goals.length === 0 ? (
          <Card style={styles.empty}>
            <Ionicons name="flag-outline" size={36} color={colors.textDim} />
            <Text style={styles.emptyText}>
              Creá tu primera meta: fondo de emergencia, viaje, deuda, lo que sea.
            </Text>
          </Card>
        ) : (
          state.goals.map((goal) => {
            const pct = Math.min(
              100,
              Math.round((goal.currentAmount / goal.targetAmount) * 100)
            );
            return (
              <Card key={goal.id} style={styles.goal}>
                <View style={styles.goalTop}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Eliminar meta', `¿Borrar "${goal.name}"?`, [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Eliminar',
                          style: 'destructive',
                          onPress: () => removeGoal(goal.id),
                        },
                      ])
                    }
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.textDim} />
                  </Pressable>
                </View>
                <Text style={styles.goalAmounts}>
                  {formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.pct}>{pct}% completado</Text>

                <View style={styles.contribRow}>
                  <TextInput
                    style={styles.contribInput}
                    placeholder="Aportar $"
                    placeholderTextColor={colors.textDim}
                    keyboardType="decimal-pad"
                    value={contrib[goal.id] ?? ''}
                    onChangeText={(v) =>
                      setContrib((prev) => ({ ...prev, [goal.id]: v }))
                    }
                  />
                  <PrimaryButton
                    label="Sumar"
                    onPress={() => {
                      const amount = Number(contrib[goal.id]?.replace(',', '.'));
                      if (!amount || amount <= 0) return;
                      contributeToGoal(goal.id, amount);
                      setContrib((prev) => ({ ...prev, [goal.id]: '' }));
                    }}
                  />
                </View>
              </Card>
            );
          })
        )}
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
    alignItems: 'flex-end',
    gap: 12,
  },
  empty: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  emptyText: {
    
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  goal: {
    gap: 10,
  },
  goalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalName: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    color: colors.text,
  },
  goalAmounts: {
    
    color: colors.textMuted,
    fontSize: 14,
  },
  barTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
  pct: {
    
    color: colors.accent,
    fontSize: 13,
  },
  contribRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  contribInput: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    color: colors.text,
    
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
