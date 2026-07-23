import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  applyPreparedUpdate,
  checkAndPrepareUpdate,
  startUpdateAvailabilityWatcher,
  updatesAreSupported,
  type UpdateProgress,
} from '../lib/updates';
import { notifyAppUpdateReady } from '../lib/notifications';

const BOOT_CHECK_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(null);
      });
  });
}

/**
 * No bloquea el arranque.
 * Busca updates en segundo plano con timeout (nunca deja la app en negro).
 */
export function UpdateBootstrap({ children }: { children: ReactNode }) {
  const [readyVisible, setReadyVisible] = useState(false);
  const [applying, setApplying] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(
    null
  );
  const skipUpdates = !updatesAreSupported();
  const started = useRef(false);

  useEffect(() => {
    if (skipUpdates) return;
    if (started.current) return;
    started.current = true;

    let cancelled = false;

    const showReady = async (notify: boolean) => {
      if (cancelled) return;
      setDownloadProgress(null);
      if (notify) {
        try {
          await notifyAppUpdateReady();
        } catch {
          // ignore
        }
      }
      setReadyVisible(true);
    };

    const boot = async () => {
      try {
        const result = await withTimeout(
          checkAndPrepareUpdate(
            'es',
            (p) => {
              if (!cancelled) setDownloadProgress(p);
            },
            { force: true }
          ),
          BOOT_CHECK_TIMEOUT_MS
        );

        if (cancelled) return;

        if (result?.status === 'readyToApply') {
          await showReady(true);
          return;
        }
      } catch {
        // Nunca tumbar el arranque por updates
      } finally {
        if (!cancelled) setDownloadProgress(null);
      }
    };

    void boot();

    const stop = startUpdateAvailabilityWatcher((updateId) => {
      if (!cancelled) {
        setDownloadProgress(null);
        setReadyVisible(true);
      }
      void updateId;
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, [skipUpdates]);

  const onLater = () => {
    setApplying(false);
    setReadyVisible(false);
  };

  const onApply = async () => {
    setApplying(true);
    try {
      const ok = await withTimeout(applyPreparedUpdate(), 8000);
      if (ok === null) {
        setApplying(false);
        setReadyVisible(true);
      }
    } catch {
      setApplying(false);
      setReadyVisible(true);
    }
  };

  const pct = Math.round((downloadProgress?.progress ?? 0) * 100);
  const showBar =
    Boolean(downloadProgress) &&
    !readyVisible &&
    downloadProgress!.phase !== 'applying';

  return (
    <>
      {children}

      {showBar ? (
        <View style={styles.barWrap} pointerEvents="none">
          <View style={styles.barCard}>
            <Text style={styles.barTitle}>Actualizando</Text>
            <Text style={styles.barMsg}>
              {downloadProgress?.message ?? 'Descargando la última versión…'}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.max(4, pct)}%` }]} />
            </View>
            <Text style={styles.barPct}>{pct}%</Text>
          </View>
        </View>
      ) : null}

      <Modal
        visible={readyVisible}
        transparent
        animationType="fade"
        onRequestClose={onLater}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.brand}>Finanzas</Text>
            <Text style={styles.title}>Última versión lista</Text>
            <Text style={styles.body}>
              Bajó el pack completo. Tocá Actualizar ahora: tus movimientos y
              Ahorro no se borran.
            </Text>

            {applying ? (
              <View style={styles.busy}>
                <ActivityIndicator color="#3DDC97" />
                <Text style={styles.busyText}>Instalando…</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: '100%' }]} />
                </View>
                <Pressable style={styles.secondaryBtn} onPress={onLater}>
                  <Text style={styles.secondaryText}>Cancelar</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.actions}>
                <Pressable style={styles.primaryBtn} onPress={onApply}>
                  <Text style={styles.primaryText}>Actualizar ahora</Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={onLater}>
                  <Text style={styles.secondaryText}>Más tarde</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  barCard: {
    backgroundColor: '#122E26',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#234A3E',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
    elevation: 6,
  },
  barTitle: {
    color: '#3DDC97',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  barMsg: {
    color: '#9BB5AB',
    fontSize: 13,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#234A3E',
    overflow: 'hidden',
    marginTop: 4,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#3DDC97',
  },
  barPct: {
    color: '#F2F7F4',
    fontWeight: '700',
    fontSize: 12,
    alignSelf: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#122E26',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#234A3E',
  },
  brand: {
    color: '#3DDC97',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#F2F7F4',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  body: {
    color: '#9BB5AB',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  actions: {
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#3DDC97',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#0B1F1A',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#234A3E',
  },
  secondaryText: {
    color: '#F2F7F4',
    fontWeight: '600',
    fontSize: 15,
  },
  busy: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  busyText: {
    color: '#9BB5AB',
    fontWeight: '600',
  },
});
