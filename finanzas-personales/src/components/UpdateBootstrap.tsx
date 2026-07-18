import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

type Phase = 'checking' | 'downloading' | 'applying' | 'ready' | 'skip';

/**
 * Pantalla de arranque: busca update, muestra progreso y reinicia.
 * No importa Firebase ni módulos nativos opcionales.
 */
export function UpdateBootstrap({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('checking');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Buscando actualización…');
  const started = useRef(false);

  const updates = Updates.useUpdates();

  const skipUpdates =
    __DEV__ ||
    Constants.appOwnership === 'expo' ||
    !Updates.isEnabled;

  useEffect(() => {
    if (skipUpdates) {
      setPhase('skip');
      return;
    }
    if (started.current) return;
    started.current = true;

    let cancelled = false;

    (async () => {
      try {
        setPhase('checking');
        setProgress(0.05);
        setStatusText('Buscando actualización…');

        const check = await Updates.checkForUpdateAsync();
        if (cancelled) return;

        if (!check.isAvailable) {
          setProgress(1);
          setPhase('ready');
          return;
        }

        setPhase('downloading');
        setStatusText('Descargando actualización…');
        setProgress(0.15);

        const tick = setInterval(() => {
          setProgress((p) => (p < 0.85 ? p + 0.03 : p));
        }, 400);

        const result = await Updates.fetchUpdateAsync();
        clearInterval(tick);
        if (cancelled) return;

        if (result.isNew) {
          setPhase('applying');
          setProgress(1);
          setStatusText('Activando actualización…');
          await new Promise((r) => setTimeout(r, 450));
          await Updates.reloadAsync();
          return;
        }

        setProgress(1);
        setPhase('ready');
      } catch {
        if (!cancelled) {
          setStatusText('No se pudo actualizar. Continuando…');
          setProgress(1);
          setTimeout(() => {
            if (!cancelled) setPhase('ready');
          }, 600);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [skipUpdates]);

  // Usar progreso real del download si expo-updates lo reporta
  useEffect(() => {
    if (
      phase === 'downloading' &&
      typeof updates.downloadProgress === 'number' &&
      updates.downloadProgress > 0
    ) {
      setProgress(Math.max(0.15, Math.min(0.95, updates.downloadProgress)));
    }
  }, [phase, updates.downloadProgress]);

  if (skipUpdates || phase === 'ready' || phase === 'skip') {
    return <>{children}</>;
  }

  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);

  return (
    <View style={styles.root}>
      <Text style={styles.brand}>Finanzas</Text>
      <Text style={styles.title}>Actualizando la app</Text>
      <Text style={styles.subtitle}>{statusText}</Text>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.pct}>{pct}%</Text>

      {phase === 'checking' || phase === 'downloading' ? (
        <ActivityIndicator color="#3DDC97" style={{ marginTop: 18 }} />
      ) : null}

      <Text style={styles.hint}>
        No cierres la app. Tus datos se mantienen en este teléfono.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B1F1A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  brand: {
    color: '#3DDC97',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    color: '#F2F7F4',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9BB5AB',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
  },
  barTrack: {
    width: '100%',
    maxWidth: 320,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#234A3E',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#3DDC97',
    borderRadius: 999,
  },
  pct: {
    marginTop: 10,
    color: '#F2F7F4',
    fontWeight: '700',
    fontSize: 16,
  },
  hint: {
    marginTop: 28,
    color: '#6F8A7F',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
