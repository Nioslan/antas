import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useFinance } from '@/src/context/FinanceContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

function money(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function GoalsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { state, updateGoalSaved, removeGoal, removeFixedExpense } = useFinance();

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <FlatList
        data={state.goals}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.title, { color: c.text }]}>Metas</Text>
            <Text style={{ color: c.muted, marginBottom: 16 }}>
              Se sincronizan con tu cuenta cuando iniciás sesión.
            </Text>
            <Text style={[styles.subtitle, { color: c.text }]}>
              Fijos ({state.fixedExpenses.length})
            </Text>
            {state.fixedExpenses.length === 0 ? (
              <Text style={{ color: c.muted, marginBottom: 12 }}>Sin gastos fijos.</Text>
            ) : (
              state.fixedExpenses.map((f) => (
                <Pressable
                  key={f.id}
                  onLongPress={() =>
                    Alert.alert('Eliminar fijo', f.title, [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: () => removeFixedExpense(f.id),
                      },
                    ])
                  }
                  style={[styles.row, { borderColor: c.border, backgroundColor: c.card }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontWeight: '700' }}>{f.title}</Text>
                    <Text style={{ color: c.muted }}>Día {f.dayOfMonth}</Text>
                  </View>
                  <Text style={{ color: c.text, fontWeight: '700' }}>{money(f.amount)}</Text>
                </Pressable>
              ))
            )}
            <Text style={[styles.subtitle, { color: c.text, marginTop: 8 }]}>Tus metas</Text>
          </View>
        }
        ListEmptyComponent={<Text style={{ color: c.muted }}>Creá una meta desde Inicio.</Text>}
        renderItem={({ item }) => {
          const pct = item.targetAmount > 0 ? Math.min(1, item.savedAmount / item.targetAmount) : 0;
          return (
            <Pressable
              onLongPress={() =>
                Alert.alert('Eliminar meta', item.title, [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => removeGoal(item.id),
                  },
                ])
              }
              onPress={() => updateGoalSaved(item.id, item.savedAmount + 1000)}
              style={[styles.row, { borderColor: c.border, backgroundColor: c.card }]}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: c.text, fontWeight: '700' }}>{item.title}</Text>
                <Text style={{ color: c.muted }}>
                  {money(item.savedAmount)} / {money(item.targetAmount)}
                </Text>
                <View style={[styles.barBg, { backgroundColor: c.border }]}>
                  <View
                    style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: c.tint }]}
                  />
                </View>
                <Text style={{ color: c.muted, fontSize: 12 }}>Tocá para +$1.000</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barBg: { height: 8, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%' },
});
