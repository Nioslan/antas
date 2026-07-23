import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  Chip,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '../src/components/ui';
import { useSettings } from '../src/context/SettingsContext';
import {
  isBuiltinCategory,
  type EditableCategoryKind,
} from '../src/lib/categories';
import { colors, radius, spacing } from '../src/theme';

function parseKind(raw?: string | string[]): EditableCategoryKind {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'giro' ? 'giro' : 'gasto';
}

export default function ManageCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const {
    gastoCategories,
    giroCategories,
    addEditableCategory,
    renameEditableCategory,
    removeEditableCategory,
  } = useSettings();

  const [kind, setKind] = useState<EditableCategoryKind>(parseKind(params.type));
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  useEffect(() => {
    setKind(parseKind(params.type));
  }, [params.type]);

  const categories = kind === 'gasto' ? gastoCategories : giroCategories;

  const sorted = useMemo(
    () =>
      [...categories].sort((a, b) => {
        if (!!a.custom !== !!b.custom) return a.custom ? 1 : -1;
        return a.label.localeCompare(b.label, 'es');
      }),
    [categories]
  );

  const switchKind = (next: EditableCategoryKind) => {
    setKind(next);
    setEditingId(null);
    setEditLabel('');
    setNewLabel('');
  };

  const onAdd = () => {
    const result = addEditableCategory(kind, newLabel);
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
    const result = renameEditableCategory(kind, editingId, editLabel);
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
      `¿Borrar "${label}"? Los movimientos viejos con esta categoría siguen, pero no vas a poder elegirla en nuevos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const result = removeEditableCategory(kind, id);
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
            <Title>Categorías</Title>
            <Subtitle>
              {kind === 'gasto'
                ? 'Renombrá o agregá categorías de gasto (ej: Colegio, Mascotas).'
                : 'Renombrá o agregá categorías de ingreso (ej: Propina, Alquiler cobrado).'}
            </Subtitle>
          </View>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.cancel}>Cerrar</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <Chip
            label="Gasto"
            active={kind === 'gasto'}
            onPress={() => switchKind('gasto')}
          />
          <Chip
            label="Ingreso"
            active={kind === 'giro'}
            onPress={() => switchKind('giro')}
          />
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

        <Text style={styles.section}>
          {kind === 'gasto' ? 'Categorías de gasto' : 'Categorías de ingreso'}
        </Text>
        {sorted.map((cat) => {
          const editing = editingId === cat.id;
          const custom = cat.custom || !isBuiltinCategory(kind, cat.id);
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
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.catName}>{cat.label}</Text>
                    <Text style={styles.catMeta}>
                      {custom ? 'Personalizada' : 'Base'}
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
                  {custom ? (
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
