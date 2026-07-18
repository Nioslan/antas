import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/src/context/AuthContext';
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

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const router = useRouter();
  const { user } = useAuth();
  const {
    ready,
    state,
    syncStatus,
    setCashNow,
    addTransaction,
    removeTransaction,
    addGoal,
    addFixedExpense,
  } = useFinance();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of state.transactions) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, balance: income - expense };
  }, [state.transactions]);

  const submitTx = () => {
    const value = Number(String(amount).replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert('Monto inválido', 'Ingresá un número mayor a 0.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    addTransaction({
      type,
      amount: value,
      note: note.trim() || (type === 'income' ? 'Ingreso' : 'Gasto'),
      category: type === 'income' ? 'General' : 'General',
      date: today,
    });
    setAmount('');
    setNote('');
  };

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Text style={{ color: c.muted }}>Cargando…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <View style={[styles.header, { backgroundColor: c.forest }]}>
        <View style={styles.headerRow}>
          <Text style={styles.brand}>Finanzas</Text>
          <Pressable onPress={() => router.push('/settings')}>
            <Text style={styles.headerLink}>Ajustes</Text>
          </Pressable>
        </View>
        <Text style={styles.cashLabel}>Efectivo ahora</Text>
        <Text style={styles.cashValue}>{money(state.cashNow)}</Text>
        <Text style={styles.syncHint}>
          {user
            ? syncStatus === 'synced'
              ? 'Cuenta sincronizada'
              : syncStatus === 'syncing'
                ? 'Sincronizando…'
                : syncStatus === 'offline'
                  ? 'Sin conexión · datos locales'
                  : 'Sesión activa'
            : 'Sin cuenta · solo este teléfono'}
        </Text>
      </View>

      <FlatList
        data={state.transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.cardTitle, { color: c.text }]}>Resumen</Text>
              <Text style={{ color: c.muted }}>
                Ingresos {money(totals.income)} · Gastos {money(totals.expense)}
              </Text>
              <Text style={[styles.balance, { color: c.text }]}>
                Balance {money(totals.balance)}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.cardTitle, { color: c.text }]}>Nuevo movimiento</Text>
              <View style={styles.typeRow}>
                {(['expense', 'income'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setType(t)}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: type === t ? c.tint : 'transparent',
                        borderColor: c.border,
                      },
                    ]}>
                    <Text style={{ color: type === t ? '#fff' : c.text, fontWeight: '600' }}>
                      {t === 'expense' ? 'Gasto' : 'Ingreso'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={[styles.input, { borderColor: c.border, color: c.text }]}
                placeholder="Monto"
                placeholderTextColor={c.muted}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
              <TextInput
                style={[styles.input, { borderColor: c.border, color: c.text }]}
                placeholder="Nota"
                placeholderTextColor={c.muted}
                value={note}
                onChangeText={setNote}
              />
              <Pressable style={[styles.btn, { backgroundColor: c.tint }]} onPress={submitTx}>
                <Text style={styles.btnText}>Guardar</Text>
              </Pressable>
            </View>

            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.cardTitle, { color: c.text }]}>Atajos</Text>
              <View style={styles.shortcutRow}>
                <Pressable
                  style={[styles.shortcut, { borderColor: c.border }]}
                  onPress={() => {
                    const next = state.cashNow + 1000;
                    setCashNow(next);
                  }}>
                  <Text style={{ color: c.text, fontWeight: '600' }}>+$1.000 efectivo</Text>
                </Pressable>
                <Pressable
                  style={[styles.shortcut, { borderColor: c.border }]}
                  onPress={() =>
                    addGoal({ title: 'Meta rápida', targetAmount: 50000, savedAmount: 0 })
                  }>
                  <Text style={{ color: c.text, fontWeight: '600' }}>
                    Meta ({state.goals.length})
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.shortcut, { borderColor: c.border }]}
                  onPress={() =>
                    addFixedExpense({
                      title: 'Fijo',
                      amount: 10000,
                      dayOfMonth: 1,
                      notify: false,
                    })
                  }>
                  <Text style={{ color: c.text, fontWeight: '600' }}>
                    Fijos ({state.fixedExpenses.length})
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text style={[styles.section, { color: c.text }]}>Movimientos</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={{ color: c.muted, marginTop: 8 }}>Todavía no hay movimientos.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() =>
              Alert.alert('Eliminar', '¿Borrar este movimiento?', [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Eliminar',
                  style: 'destructive',
                  onPress: () => removeTransaction(item.id),
                },
              ])
            }
            style={[styles.txRow, { borderBottomColor: c.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: '600' }}>{item.note}</Text>
              <Text style={{ color: c.muted, fontSize: 12 }}>{item.date}</Text>
            </View>
            <Text
              style={{
                color: item.type === 'income' ? c.tint : c.danger,
                fontWeight: '700',
              }}>
              {item.type === 'income' ? '+' : '-'}
              {money(item.amount)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  brand: {
    color: '#E8FFF5',
    fontSize: 28,
    fontWeight: '800',
  },
  headerLink: {
    color: '#C9EBD9',
    fontWeight: '600',
  },
  cashLabel: {
    color: '#A7D4C0',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cashValue: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    marginTop: 4,
  },
  syncHint: {
    color: '#9FCBB8',
    marginTop: 8,
    fontSize: 13,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
    gap: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  balance: {
    fontSize: 18,
    fontWeight: '700',
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  btn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  shortcutRow: { gap: 8 },
  shortcut: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  section: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
});
