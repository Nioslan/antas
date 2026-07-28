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
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../src/components/ui';
import { useFinance } from '../src/context/FinanceContext';
import { useTheme } from '../src/context/SettingsContext';
import { analyzeAllocation } from '../src/lib/allocation';
import { formatMoney } from '../src/lib/categories';
import { spacing, type ThemeColors } from '../src/theme';

export default function HogarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    state,
    addHouseholdMember,
    removeHouseholdMember,
    setAllocationRule,
  } = useFinance();

  const [name, setName] = useState('');
  const [needs, setNeeds] = useState(String(state.allocationRule?.needs ?? 50));
  const [wants, setWants] = useState(String(state.allocationRule?.wants ?? 30));
  const [savings, setSavings] = useState(
    String(state.allocationRule?.savings ?? 20)
  );

  const members = state.householdMembers ?? [];
  const alloc = useMemo(() => analyzeAllocation(state), [state]);

  const byMember = useMemo(() => {
    const map = new Map<string, { gasto: number; giro: number }>();
    for (const m of members) map.set(m.id, { gasto: 0, giro: 0 });
    for (const t of state.transactions) {
      if (!t.memberId || !map.has(t.memberId)) continue;
      const row = map.get(t.memberId)!;
      if (t.type === 'gasto') row.gasto += t.amount;
      if (t.type === 'giro') row.giro += t.amount;
    }
    return map;
  }, [members, state.transactions]);

  const saveRule = () => {
    setAllocationRule({
      needs: Number(needs) || 0,
      wants: Number(wants) || 0,
      savings: Number(savings) || 0,
    });
    Alert.alert('Listo', 'Regla de % actualizada.');
  };

  return (
    <Screen style={{ paddingTop: insets.top + 8 }}>
      <KeyboardForm contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Title>Hogar y regla %</Title>
            <Subtitle>
              Miembros locales (sin nube) y tu regla tipo 50/30/20.
            </Subtitle>
          </View>
        </View>

        <Card style={{ gap: 8 }}>
          <Text style={styles.section}>Regla de asignación</Text>
          <Text style={styles.hint}>
            Ahora: necesidades {alloc.needs.pct}% · gustos {alloc.wants.pct}% ·
            ahorro {alloc.savings.pct}%. {alloc.tip}
          </Text>
          <View style={styles.rowInputs}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.mini}>Necesidades %</Text>
              <TextInput
                style={styles.input}
                value={needs}
                onChangeText={setNeeds}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.mini}>Gustos %</Text>
              <TextInput
                style={styles.input}
                value={wants}
                onChangeText={setWants}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.mini}>Ahorro %</Text>
              <TextInput
                style={styles.input}
                value={savings}
                onChangeText={setSavings}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <PrimaryButton label="Guardar regla" onPress={saveRule} />
          <PrimaryButton
            label="Usar 50 / 30 / 20"
            tone="muted"
            onPress={() => {
              setNeeds('50');
              setWants('30');
              setSavings('20');
              setAllocationRule({ needs: 50, wants: 30, savings: 20 });
            }}
          />
        </Card>

        <Card style={{ gap: 8 }}>
          <Text style={styles.section}>Miembros del hogar</Text>
          <Text style={styles.hint}>
            Todo queda en este teléfono. Al cargar un gasto podés etiquetar quién
            fue.
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nombre (ej. Ana)"
            placeholderTextColor={colors.textDim}
          />
          <PrimaryButton
            label="Agregar miembro"
            onPress={() => {
              if (!name.trim()) return;
              addHouseholdMember(name);
              setName('');
            }}
          />
          {members.length === 0 ? (
            <Text style={styles.empty}>Todavía no hay miembros.</Text>
          ) : (
            members.map((m) => {
              const stats = byMember.get(m.id) ?? { gasto: 0, giro: 0 };
              return (
                <View key={m.id} style={styles.member}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{m.name}</Text>
                    <Text style={styles.meta}>
                      Ingresos {formatMoney(stats.giro)} · gastos{' '}
                      {formatMoney(stats.gasto)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Quitar', `¿Sacar a ${m.name}?`, [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Quitar',
                          style: 'destructive',
                          onPress: () => removeHouseholdMember(m.id),
                        },
                      ])
                    }
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.textDim} />
                  </Pressable>
                </View>
              );
            })
          )}
        </Card>
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
    section: { color: colors.text, fontWeight: '700', fontSize: 16 },
    hint: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
    rowInputs: { flexDirection: 'row', gap: 8 },
    mini: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
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
    member: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    rowTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
    meta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  });
}
