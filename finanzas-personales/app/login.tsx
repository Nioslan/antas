import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '@/src/context/AuthContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function LoginScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { user, loading, configured, error, clearError, signInEmail, signUpEmail, signInWithGoogle } =
    useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

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
      if (mode === 'login') {
        await signInEmail(email, password);
      } else {
        await signUpEmail(email, password, name);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error de acceso');
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    clearError();
    setLocalError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error con Google');
    } finally {
      setBusy(false);
    }
  };

  const message = localError || error;

  return (
    <>
      <Stack.Screen options={{ title: mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta' }} />
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: c.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.hero, { backgroundColor: c.forest }]}>
          <Text style={styles.brand}>Finanzas</Text>
          <Text style={styles.heroText}>
            Tu historial viaja con tu cuenta. Entrá y recuperá movimientos, metas y fijos en
            cualquier teléfono.
          </Text>
        </View>

        <View style={styles.form}>
          {!configured ? (
            <View style={[styles.banner, { backgroundColor: '#FFF4D6', borderColor: '#E6C86A' }]}>
              <Text style={{ color: '#5C4B12', fontWeight: '600' }}>
                Firebase todavía no está configurado. Completá `src/lib/firebaseConfig.ts` (ver
                FIREBASE_SETUP.md).
              </Text>
            </View>
          ) : null}

          {mode === 'register' ? (
            <TextInput
              style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
              placeholder="Nombre (opcional)"
              placeholderTextColor={c.muted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          ) : null}

          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
            placeholder="Email"
            placeholderTextColor={c.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.card }]}
            placeholder="Contraseña"
            placeholderTextColor={c.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'login' ? 'password' : 'new-password'}
          />

          {message ? <Text style={[styles.error, { color: c.danger }]}>{message}</Text> : null}

          <Pressable
            style={[styles.primaryBtn, { backgroundColor: c.tint, opacity: busy ? 0.7 : 1 }]}
            disabled={busy || !configured}
            onPress={submit}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.googleBtn, { borderColor: c.border, backgroundColor: c.card }]}
            disabled={busy || !configured}
            onPress={onGoogle}>
            <Text style={[styles.googleBtnText, { color: c.text }]}>Continuar con Google</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setMode((m) => (m === 'login' ? 'register' : 'login'));
              clearError();
              setLocalError(null);
            }}>
            <Text style={[styles.switchText, { color: c.muted }]}>
              {mode === 'login'
                ? '¿No tenés cuenta? Crear una'
                : '¿Ya tenés cuenta? Iniciar sesión'}
            </Text>
          </Pressable>

          <Link href="/(tabs)" style={styles.skip}>
            <Text style={{ color: c.muted }}>Seguir sin cuenta (solo este teléfono)</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  brand: {
    color: '#E8FFF5',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  heroText: {
    color: '#C9EBD9',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 360,
  },
  form: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
  },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  googleBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  googleBtnText: {
    fontWeight: '600',
    fontSize: 16,
  },
  switchText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
  skip: {
    marginTop: 16,
    alignSelf: 'center',
  },
  error: {
    fontSize: 14,
  },
});
