import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, Stack } from 'expo-router';

import { useAuth } from '@/src/context/AuthContext';
import { useFinance } from '@/src/context/FinanceContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

function syncLabel(status: string): string {
  switch (status) {
    case 'syncing':
      return 'Sincronizando…';
    case 'synced':
      return 'Sincronizado';
    case 'offline':
      return 'Sin conexión (datos locales)';
    case 'error':
      return 'Error de sync';
    default:
      return 'Sin sincronizar';
  }
}

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { user, configured, logout, loading } = useAuth();
  const { syncStatus, syncError, lastSyncedAt, syncNow } = useFinance();
  const [busy, setBusy] = useState(false);

  const onSync = async () => {
    setBusy(true);
    try {
      await syncNow();
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    setBusy(true);
    try {
      await logout();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Ajustes' }} />
      <ScrollView style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Cuenta</Text>
        <View style={[styles.block, { backgroundColor: c.card, borderColor: c.border }]}>
          {!configured ? (
            <Text style={{ color: c.muted, lineHeight: 20 }}>
              Firebase no configurado. Seguí FIREBASE_SETUP.md y pegá el config en
              src/lib/firebaseConfig.ts para habilitar la nube.
            </Text>
          ) : loading ? (
            <ActivityIndicator color={c.tint} />
          ) : user ? (
            <>
              <Text style={[styles.label, { color: c.muted }]}>Sesión</Text>
              <Text style={[styles.value, { color: c.text }]}>
                {user.displayName || user.email || user.uid}
              </Text>
              {user.email && user.displayName ? (
                <Text style={{ color: c.muted, marginTop: 2 }}>{user.email}</Text>
              ) : null}

              <Text style={[styles.label, { color: c.muted, marginTop: 16 }]}>Sincronización</Text>
              <Text style={[styles.value, { color: c.text }]}>{syncLabel(syncStatus)}</Text>
              {lastSyncedAt ? (
                <Text style={{ color: c.muted, marginTop: 2, fontSize: 13 }}>
                  Última: {new Date(lastSyncedAt).toLocaleString()}
                </Text>
              ) : null}
              {syncError ? (
                <Text style={{ color: c.danger, marginTop: 8 }}>{syncError}</Text>
              ) : null}

              <Pressable
                style={[styles.btn, { backgroundColor: c.tint, opacity: busy ? 0.7 : 1 }]}
                disabled={busy}
                onPress={onSync}>
                {busy && syncStatus === 'syncing' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Sincronizar ahora</Text>
                )}
              </Pressable>

              <Pressable
                style={[styles.btnOutline, { borderColor: c.border }]}
                disabled={busy}
                onPress={onLogout}>
                <Text style={{ color: c.text, fontWeight: '600' }}>Cerrar sesión</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={{ color: c.text, lineHeight: 21, marginBottom: 12 }}>
                Iniciá sesión para guardar movimientos, metas, fijos y efectivo en la nube y
                recuperarlos en otro teléfono.
              </Text>
              <Link href="/login" asChild>
                <Pressable style={[styles.btn, { backgroundColor: c.tint }]}>
                  <Text style={styles.btnText}>Iniciar sesión / Crear cuenta</Text>
                </Pressable>
              </Link>
            </>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: c.text, marginTop: 28 }]}>Acerca de</Text>
        <View style={[styles.block, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={{ color: c.muted, lineHeight: 20 }}>
            Finanzas personales · sync con Firebase Auth + Firestore. La clave de OpenAI queda
            solo en este dispositivo.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  block: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 4,
  },
  btn: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  btnOutline: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: 'center',
  },
});
