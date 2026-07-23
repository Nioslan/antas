import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Switch,
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
  SegmentedControl,
  SettingsRow,
  Subtitle,
  Title,
} from '../src/components/ui';
import { useFinance } from '../src/context/FinanceContext';
import { useSettings } from '../src/context/SettingsContext';
import { formatMoney } from '../src/lib/categories';
import {
  notifyDueBillsNow,
  scheduleFixedReminders,
} from '../src/lib/notifications';
import { getOpenAiKey, setOpenAiKey } from '../src/lib/storage';
import { sanitizeApiKey, testOpenAiKey } from '../src/lib/ai';
import { checkAndPrepareUpdate, applyPreparedUpdate, getUpdateMeta } from '../src/lib/updates';
import type { AppCurrency, AppLanguage, ThemeMode } from '../src/i18n';
import { spacing } from '../src/theme';

const KEYS_URL = 'https://platform.openai.com/api-keys';
const SUPPORT_EMAIL = 'antasestudio@gmail.com';
const HELP_URL = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  'Antas — queja o felicitación'
)}&body=${encodeURIComponent(
  'Hola Antas,\n\nEscribo para:\n( ) Queja\n( ) Felicitación\n\nMensaje:\n'
)}`;
const APP_VERSION =
  Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '1.0.0';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    today,
    clearChat,
    resetAllData,
    exportDataJson,
    exportDataCsv,
    importDataJson,
    state,
  } = useFinance();
  const {
    colors,
    tr,
    language,
    settings,
    setThemeMode,
    setLanguage,
    setCurrency,
    setNotificationsEnabled,
    setHapticsEnabled,
    setSaturdayBonusEnabled,
    currencyOptions,
  } = useSettings();
  const updateMeta = getUpdateMeta();

  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<{
    progress: number;
    message: string;
  } | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    getOpenAiKey().then((key) => {
      setHasKey(Boolean(key));
      if (key) setApiKey(key);
    });
  }, []);

  const saveKey = async () => {
    const trimmed = sanitizeApiKey(apiKey);
    if (trimmed && !trimmed.startsWith('sk-')) {
      Alert.alert(
        'Revisá la clave',
        'Las API keys de OpenAI suelen empezar con sk- o sk-proj-.'
      );
      return;
    }
    try {
      await setOpenAiKey(trimmed);
      setApiKey(trimmed);
      setHasKey(Boolean(trimmed));
      Alert.alert(
        'Listo',
        trimmed
          ? 'Clave guardada. Tocá “Probar conexión” para verificarla.'
          : 'Clave eliminada. Se usará el coach local.'
      );
    } catch (err) {
      Alert.alert(
        'No se pudo guardar',
        err instanceof Error ? err.message : 'Error al guardar la clave.'
      );
    }
  };

  const testKey = async () => {
    setTesting(true);
    try {
      const result = await testOpenAiKey(apiKey || (await getOpenAiKey()) || '');
      Alert.alert(result.ok ? 'Conexión OK' : 'Error de OpenAI', result.message);
      if (result.ok) {
        const cleaned = sanitizeApiKey(apiKey);
        if (cleaned) {
          await setOpenAiKey(cleaned);
          setApiKey(cleaned);
          setHasKey(true);
        }
      }
    } finally {
      setTesting(false);
    }
  };

  const onToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      await scheduleFixedReminders(state.fixedExpenses);
      const digest = await notifyDueBillsNow(state.fixedExpenses, {
        force: true,
      });
      Alert.alert(
        'Notificaciones',
        digest.count > 0
          ? `Avisos afuera de la app activados (con vibración). Tenés ${digest.count} pago(s) cerca.`
          : 'Avisos afuera de la app activados (con vibración): 5, 3 y 1 día antes, y el día del pago.'
      );
    } else {
      Alert.alert('Notificaciones', 'No se programarán nuevos recordatorios.');
    }
  };

  const checkUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateProgress({ progress: 0.05, message: 'Buscando actualización…' });
    try {
      const result = await checkAndPrepareUpdate(language, (p) => {
        setUpdateProgress({ progress: p.progress, message: p.message });
      });
      if (result.status === 'readyToApply') {
        Alert.alert(tr('checkUpdates'), result.message, [
          { text: 'Más tarde', style: 'cancel' },
          {
            text: 'Actualizar ahora',
            onPress: () => {
              void applyPreparedUpdate();
            },
          },
        ]);
        return;
      }
      Alert.alert(tr('checkUpdates'), result.message);
    } finally {
      setCheckingUpdate(false);
      setUpdateProgress(null);
    }
  };

  const exportData = async () => {
    try {
      await Share.share({
        message: exportDataJson(),
        title: 'finanzas-backup.json',
      });
    } catch {
      Alert.alert('Error', 'No se pudo exportar.');
    }
  };

  const exportCsv = async () => {
    try {
      await Share.share({
        message: exportDataCsv(),
        title: 'finanzas-export.csv',
      });
    } catch {
      Alert.alert('Error', 'No se pudo exportar el CSV.');
    }
  };

  const runImport = async () => {
    setImporting(true);
    try {
      const result = await importDataJson(importText);
      if (!result.ok) {
        Alert.alert('No se pudo importar', result.error);
        return;
      }
      setImportOpen(false);
      setImportText('');
      Alert.alert('Listo', 'Tus datos se recuperaron en este teléfono.');
    } finally {
      setImporting(false);
    }
  };

  const confirmClearChat = () => {
    Alert.alert(tr('clearChat'), '¿Borrar el historial del coach?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: () => {
          clearChat();
          Alert.alert('Listo', 'Chat borrado.');
        },
      },
    ]);
  };

  const confirmReset = () => {
    Alert.alert(
      tr('resetApp'),
      'Se borrarán movimientos, metas, fijos, efectivo y chat. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            Alert.alert('Listo', 'Datos eliminados.');
          },
        },
      ]
    );
  };

  const updatePct = Math.round((updateProgress?.progress ?? 0) * 100);

  return (
    <Screen style={{ paddingTop: insets.top + 12 }}>
      <Modal visible={Boolean(updateProgress)} transparent animationType="fade">
        <View style={styles.updateOverlay}>
          <View style={[styles.updateCard, { backgroundColor: colors.bgCard }]}>
            <Text style={[styles.updateTitle, { color: colors.text }]}>
              Actualizando
            </Text>
            <Text style={{ color: colors.textMuted, marginBottom: 16, textAlign: 'center' }}>
              {updateProgress?.message ?? 'Preparando…'}
            </Text>
            <View style={[styles.updateTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.updateFill,
                  { width: `${updatePct}%`, backgroundColor: colors.accent },
                ]}
              />
            </View>
            <Text style={[styles.updatePct, { color: colors.text }]}>{updatePct}%</Text>
            <Text style={{ color: colors.textDim, fontSize: 12, marginTop: 12, textAlign: 'center' }}>
              No cierres la app. Tus datos se mantienen.
            </Text>
          </View>
        </View>
      </Modal>

      <Modal visible={importOpen} transparent animationType="slide">
        <View style={styles.updateOverlay}>
          <View style={[styles.updateCard, { backgroundColor: colors.bgCard, maxHeight: '85%' }]}>
            <Text style={[styles.updateTitle, { color: colors.text }]}>
              {tr('importData')}
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                marginBottom: 12,
                textAlign: 'center',
                lineHeight: 20,
              }}>
              Abrí la app vieja (si todavía la tenés) → Ajustes → Exportar datos,
              copiá el texto y pegalo acá.
            </Text>
            <TextInput
              value={importText}
              onChangeText={setImportText}
              placeholder='{"transactions":[],"goals":[]...}'
              placeholderTextColor={colors.textDim}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                minHeight: 160,
                maxHeight: 260,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 12,
                color: colors.text,
                textAlignVertical: 'top',
                marginBottom: 12,
                fontSize: 12,
              }}
            />
            <PrimaryButton
              label={importing ? 'Importando…' : 'Restaurar datos'}
              onPress={runImport}
              disabled={importing || !importText.trim()}
            />
            <Pressable
              onPress={() => {
                setImportOpen(false);
                setImportText('');
              }}
              style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontWeight: '600' }}>
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <KeyboardForm contentContainerStyle={styles.content} bottomOffset={40}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Title>{tr('settings')}</Title>
            <Subtitle>{tr('settingsSubtitle')}</Subtitle>
          </View>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.cancel, { color: colors.textMuted }]}>
              {tr('close')}
            </Text>
          </Pressable>
        </View>

        {/* Apariencia */}
        <Text style={[styles.section, { color: colors.text }]}>
          {tr('sectionAppearance')}
        </Text>
        <Text style={[styles.label, { color: colors.textMuted }]}>{tr('theme')}</Text>
        <SegmentedControl<ThemeMode>
          value={settings.themeMode}
          onChange={setThemeMode}
          options={[
            { id: 'system', label: tr('themeSystem') },
            { id: 'light', label: tr('themeLight') },
            { id: 'dark', label: tr('themeDark') },
          ]}
        />

        <Text style={[styles.label, { color: colors.textMuted }]}>
          {tr('language')}
        </Text>
        <SegmentedControl<AppLanguage>
          value={settings.language}
          onChange={setLanguage}
          options={[
            { id: 'es', label: tr('langEs') },
            { id: 'en', label: tr('langEn') },
          ]}
        />

        {/* Preferencias */}
        <Text style={[styles.section, { color: colors.text }]}>
          {tr('sectionPreferences')}
        </Text>
        <Text style={[styles.label, { color: colors.textMuted }]}>
          {tr('currency')}
        </Text>
        <View style={styles.wrap}>
          {currencyOptions.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              active={settings.currency === c.id}
              onPress={() => setCurrency(c.id as AppCurrency)}
            />
          ))}
        </View>

        <SettingsRow
          icon={
            <Ionicons name="notifications-outline" size={20} color={colors.accent} />
          }
          title={tr('notifications')}
          subtitle={tr('notificationsHint')}
          right={
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={onToggleNotifications}
              trackColor={{ true: colors.accent, false: colors.border }}
            />
          }
        />
        <SettingsRow
          icon={<Ionicons name="phone-portrait-outline" size={20} color={colors.accent} />}
          title={tr('haptics')}
          right={
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ true: colors.accent, false: colors.border }}
            />
          }
        />
        <SettingsRow
          icon={<Ionicons name="calendar-outline" size={20} color={colors.accent} />}
          title={tr('saturdayBonus')}
          subtitle={
            settings.saturdayBonusEnabled
              ? `Activo · ${settings.saturdayBonusPercent}% (cambialo en Ahorro)`
              : tr('saturdayBonusHint')
          }
          right={
            <Switch
              value={settings.saturdayBonusEnabled}
              onValueChange={setSaturdayBonusEnabled}
              trackColor={{ true: colors.accent, false: colors.border }}
            />
          }
        />

        {/* IA */}
        <Text style={[styles.section, { color: colors.text }]}>
          {tr('sectionAi')}
        </Text>
        <SettingsRow
          icon={<Ionicons name="sparkles-outline" size={20} color={colors.accent} />}
          title={tr('aiTitle')}
          subtitle={hasKey ? tr('keyActive') : tr('keyMissing')}
          onPress={() => setAiOpen((v) => !v)}
          right={
            <Ionicons
              name={aiOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textDim}
            />
          }
        />

        {aiOpen ? (
          <View style={styles.aiBox}>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              {tr('aiHint')}
            </Text>
            <PrimaryButton
              label={tr('generateKey')}
              tone="muted"
              onPress={() => Linking.openURL(KEYS_URL)}
            />
            <Field
              label={tr('apiKey')}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-proj-..."
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showKey}
            />
            <Pressable onPress={() => setShowKey((v) => !v)}>
              <Text style={[styles.link, { color: colors.accent }]}>
                {showKey ? tr('hideKey') : tr('showKey')}
              </Text>
            </Pressable>
            <PrimaryButton label={tr('saveKey')} onPress={saveKey} />
            <PrimaryButton
              label={testing ? tr('testingKey') : tr('testKey')}
              tone="muted"
              onPress={testKey}
              disabled={testing}
            />
            {hasKey ? (
              <PrimaryButton
                label={tr('removeKey')}
                tone="expense"
                onPress={async () => {
                  setApiKey('');
                  await setOpenAiKey('');
                  setHasKey(false);
                }}
              />
            ) : null}
          </View>
        ) : null}

        {/* Herramientas */}
        <Text style={[styles.section, { color: colors.text }]}>
          Herramientas
        </Text>
        <SettingsRow
          icon={<Ionicons name="pie-chart-outline" size={20} color={colors.accent} />}
          title="Presupuestos"
          subtitle="Topes mensuales por categoría"
          onPress={() => router.push('/budgets')}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />
        <SettingsRow
          icon={<Ionicons name="analytics-outline" size={20} color={colors.accent} />}
          title="Reportes y score"
          subtitle="Compará períodos y salud financiera"
          onPress={() => router.push('/reportes')}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />
        <SettingsRow
          icon={<Ionicons name="wallet-outline" size={20} color={colors.accent} />}
          title="Sobres"
          subtitle="Plata asignada por categoría"
          onPress={() => router.push('/envelopes')}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />
        <SettingsRow
          icon={<Ionicons name="card-outline" size={20} color={colors.accent} />}
          title="Deudas y cuotas"
          onPress={() => router.push('/deudas')}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />
        <SettingsRow
          icon={<Ionicons name="calendar-outline" size={20} color={colors.accent} />}
          title="Calendario de plata"
          onPress={() => router.push('/calendario')}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />
        <SettingsRow
          icon={<Ionicons name="flame-outline" size={20} color={colors.accent} />}
          title="Reto de ahorro"
          onPress={() => router.push('/reto')}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />
        <SettingsRow
          icon={<Ionicons name="people-outline" size={20} color={colors.accent} />}
          title="Hogar y regla %"
          subtitle="Miembros locales y 50/30/20"
          onPress={() => router.push('/hogar')}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />

        {/* Datos */}
        <Text style={[styles.section, { color: colors.text }]}>
          {tr('sectionData')}
        </Text>
        <SettingsRow
          icon={<Ionicons name="share-outline" size={20} color={colors.accent} />}
          title={tr('exportData')}
          onPress={exportData}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />
        <SettingsRow
          icon={<Ionicons name="document-text-outline" size={20} color={colors.accent} />}
          title="Exportar CSV"
          subtitle="Para Excel / Google Sheets"
          onPress={exportCsv}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />
        <SettingsRow
          icon={<Ionicons name="download-outline" size={20} color={colors.accent} />}
          title={tr('importData')}
          subtitle={tr('importDataHint')}
          onPress={() => setImportOpen(true)}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />
        <SettingsRow
          icon={<Ionicons name="chatbubble-outline" size={20} color={colors.accent} />}
          title={tr('clearChat')}
          onPress={confirmClearChat}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />
        <SettingsRow
          icon={<Ionicons name="trash-outline" size={20} color={colors.expense} />}
          title={tr('resetApp')}
          onPress={confirmReset}
          danger
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />

        {/* Acerca de */}
        <Text style={[styles.section, { color: colors.text }]}>
          {tr('sectionAbout')}
        </Text>
        <SettingsRow
          icon={<Ionicons name="information-circle-outline" size={20} color={colors.accent} />}
          title={tr('version')}
          subtitle={`Finanzas Personales v${APP_VERSION} · canal ${updateMeta.channel}`}
        />
        <SettingsRow
          icon={<Ionicons name="cloud-download-outline" size={20} color={colors.accent} />}
          title={checkingUpdate ? tr('checkingUpdates') : tr('checkUpdates')}
          subtitle="Te avisamos cuando hay una nueva. Vos elegís cuándo instalarla. Tus datos no se borran."
          onPress={checkUpdates}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />
        <SettingsRow
          icon={<Ionicons name="help-circle-outline" size={20} color={colors.accent} />}
          title={tr('help')}
          subtitle={`Quejas o felicitaciones: ${SUPPORT_EMAIL}`}
          onPress={() => Linking.openURL(HELP_URL)}
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />
        <SettingsRow
          icon={<Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />}
          title={tr('privacy')}
          subtitle="Todo queda en este teléfono."
          onPress={() =>
            Alert.alert(
              tr('privacy'),
              'Movimientos, metas y efectivo se guardan solo en este teléfono. Podés exportar o importar un respaldo local desde Datos. La API key de OpenAI queda en el dispositivo (SecureStore).'
            )
          }
          right={
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          }
        />

        <Text style={[styles.section, { color: colors.text }]}>
          {tr('todaySnapshot')}
        </Text>
        <Text style={[styles.stat, { color: colors.textMuted }]}>
          {tr('free')}: {formatMoney(today.libre)}
        </Text>
        <Text style={[styles.stat, { color: colors.textMuted }]}>
          {tr('income')}: {formatMoney(today.giro)}
        </Text>
        <Text style={[styles.stat, { color: colors.textMuted }]}>
          {tr('expense')}: {formatMoney(today.gasto)}
        </Text>
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
    fontWeight: '500',
    marginTop: 8,
  },
  section: {
    fontWeight: '700',
    fontSize: 16,
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: -4,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hint: {
    lineHeight: 20,
    fontSize: 13,
  },
  link: {
    fontWeight: '600',
    fontSize: 13,
  },
  aiBox: {
    gap: 12,
    marginTop: -4,
  },
  updateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  updateCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  updateTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  updateTrack: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  updateFill: {
    height: '100%',
    borderRadius: 999,
  },
  updatePct: {
    marginTop: 10,
    fontWeight: '700',
    fontSize: 16,
  },
  stat: {
    fontSize: 14,
    marginTop: -8,
  },
});
