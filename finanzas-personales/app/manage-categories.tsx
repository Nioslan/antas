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
import { PrimaryButton, Screen, Subtitle, Title } from '../src/components/ui';
import { useSettings } from '../src/context/SettingsContext';
import { isBuiltinGastoCategory } from '../src/lib/categories';
import { colors, radius, spacing } from '../src/theme';

export default function ManageCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    gastoCategories,
    addGastoCategory,
    renameGastoCategory,
    removeGastoCategory,
  } = useSettings();

  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const sorted = useMemo(
    () =>
      [...gastoCategories].sort((a, b) => {
        if (!!a.custom !== !!b.custom) return a.custom ? 1 : -1;
        return a.label.localeCompare(b.label, 'es');
      }),
    [gastoCategories]
  );

  const onAdd = () => {
    const result = addGastoCategory(newLabel);
    if (!result.ok) {
      Alert.alert('No se pudo agregar', result.error);
      return;
    }
    setNewLabel('');
  };

  const startEdit = (id: string, label: string) => {
    setEditingId(id);
    setEditLabel(label);
  };

  const onSaveEdit = () => {
    if (!editingId) return;
    const result = renameGastoCategory(editingId, editLabel);
    if (!result.ok) {
      Alert.alert('No se pudo cambiar', result.error);
      return;
    }
    setEditingId(null);
    setEditLabel('');
  };

  const onDelete = (id: string, label: string) => {
    Alert.alert(
      'Eliminar categoría',
      `¿Borrar "${label}"? Los gastos viejos con esta categoría siguen, pero no vas a poder elegirla en nuevos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const result = removeGastoCategory(id);
            if (!result.ok) Alert.alert('No se pudo borrar', result.error);
            if (editingId === id) {
              setEditingId(null);
              setEditLabel('');
            }
          },
        },
      ]
    );
  };

  return (
    <Screen style={{ paddingTop: insets.top + 12 }}>
      <KeyboardForm contentContainerStyle={styles.content} bottomOffset={40}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Title>Categorías de gasto</Title>
            <Subtitle>
              Renombrá las de siempre o agregá las tuyas (ej: Colegio, Mascotas).
            </Subtitle>
          </View>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancel}>Cerrar</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Agregar nueva</Text>
        <View style={styles.addRow}>
          <TextInput
            value={newLabel}
            onChangeText={setNewLabel}
            placeholder="Nombre de la categoría"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            autoCapitalize="sentences"
            maxLength={40}
            onSubmitEditing={onAdd}
            returnKeyType="done"
          />
          <PrimaryButton label="Agregar" onPress={onAdd} />
        </View>

        <Text style={styles.section}>Tus categorías</Text>
        {sorted.map((cat) => {
          const editing = editingId === cat.id;
          return (
            <View key={cat.id} style={styles.card}>
              {editing ? (
                <>
                  <TextInput
                    value={editLabel}
                    onChangeText={setEditLabel}
                    style={styles.input}
                    autoFocus
                    maxLength={40}
                    onSubmitEditing={onSaveEdit}
                    returnKeyType="done"
                  />
                  <View style={styles.actions}>
                    <Pressable style={styles.actionBtn} onPress={onSaveEdit}>
                      <Text style={styles.actionOk}>Guardar</Text>
                    </Pressable>
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => {
                        setEditingId(null);
                        setEditLabel('');
                      }}
                    >
                      <Text style={styles.actionMuted}>Cancelar</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.catName}>{cat.label}</Text>
                      <Text style={styles.catMeta}>
                        {cat.custom || !isBuiltinGastoCategory(cat.id)
                          ? 'Personalizada'
                          : 'Base'}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.iconBtn}
                      onPress={() => startEdit(cat.id, cat.label)}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={18}
                        color={colors.accent}
                      />
                    </Pressable>
                    {cat.custom || !isBuiltinGastoCategory(cat.id) ? (
                      <Pressable
                        style={styles.iconBtn}
                        onPress={() => onDelete(cat.id, cat.label)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={colors.expense}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                </>
              )}
            </View>
          );
        })}
      </KeyboardForm>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: 24,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cancel: {
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 8,
  },
  section: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    marginTop: 4,
  },
  addRow: {
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: 12,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catName: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  catMeta: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  iconBtn: {
    padding: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    paddingVertical: 4,
  },
  actionOk: {
    color: colors.accent,
    fontWeight: '700',
  },
  actionMuted: {
    color: colors.textMuted,
    fontWeight: '600',
  },
});
