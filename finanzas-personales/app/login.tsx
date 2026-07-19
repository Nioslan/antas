import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardForm } from '../src/components/KeyboardForm';
import { Field, PrimaryButton, Screen, Subtitle, Title } from '../src/components/ui';
import { useAuth } from '../src/context/AuthContext';
import { spacing } from '../src/theme';
import { useSettings } from '../src/context/SettingsContext';

/** Login opcional por email (nube). La app funciona igual sin cuenta. */
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useSettings();
  const {
    user,
    loading,
    configured,
    error,
    clearError,
    signInEmail,
    signUpEmail,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [clearError]);

  if (!loading && user) {
    return <Redirect href="/(tabs)" />;
  }

  const submit = async () => {
    clearError();
    setLocalError(null);
    if (!email.trim() || !password) {
      setLocalError('Completá email y contraseña.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') await signInEmail(email, password);
      else await signUpEmail(email, password, name);
      router.replace('/(tabs)');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error de acceso');
    } finally {
      setBusy(false);
    }
  };

  const message = localError || error;

  return (
    <Screen style={{ paddingTop: insets.top + 12 }}>
      <KeyboardForm contentContainerStyle={styles.content} bottomOffset={40}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Title>Finanzas</Title>
            <Subtitle>
              Tus datos se guardan en este teléfono. La cuenta es opcional, solo
              si querés respaldo en la nube.
            </Subtitle>
          </View>
        </View>

        <PrimaryButton
          label="Seguir sin cuenta"
          tone="muted"
          onPress={() => router.replace('/(tabs)')}
        />

        <Text style={[styles.modeTitle, { color: colors.text }]}>
          {mode === 'login' ? 'Cuenta opcional' : 'Crear cuenta (opcional)'}
        </Text>

        {!configured ? (
          <View
            style={[
              styles.banner,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}>
            <Text style={{ color: colors.textMuted, lineHeight: 20 }}>
              La nube no está configurada. Podés usar la app igual: todo queda
              guardado en el teléfono.
            </Text>
          </View>
        ) : null}

        {mode === 'register' ? (
          <Field
            label="Nombre (opcional)"
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            autoCapitalize="words"
          />
        ) : null}

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Field
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
        />

        {message ? (
          <Text style={{ color: colors.expense, marginBottom: 8 }}>{message}</Text>
        ) : null}

        <PrimaryButton
          label={mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          onPress={submit}
          disabled={busy || !configured}
        />

        <Pressable
          onPress={() => {
            setMode((m) => (m === 'login' ? 'register' : 'login'));
            clearError();
            setLocalError(null);
          }}>
          <Text style={[styles.switchText, { color: colors.textMuted }]}>
            {mode === 'login'
              ? '¿No tenés cuenta? Crear una'
              : '¿Ya tenés cuenta? Iniciar sesión'}
          </Text>
        </Pressable>
      </KeyboardForm>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
    gap: 10,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  switchText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
});
