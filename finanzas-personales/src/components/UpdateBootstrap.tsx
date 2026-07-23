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
  getReadyUpdateId,
  prepareAvailableUpdate,
  startUpdateAvailabilityWatcher,
  updatesAreSupported,
} from '../lib/updates';
import { notifyAppUpdateReady } from '../lib/notifications';

/**
 * No bloquea el arranque.
 * En segundo plano descarga updates, manda notificación y muestra un aviso
 * para que el usuario elija cuándo instalar (sin perder datos).
 */
export function UpdateBootstrap({ children }: { children: ReactNode }) {
  const [readyVisible, setReadyVisible] = useState(false);
  const [applying, setApplying] = useState(false);
  const skipUpdates = !updatesAreSupported();
  const started = useRef(false);

  useEffect(() => {
    if (skipUpdates) return;
    if (started.current) return;
    started.current = true;

    let cancelled = false;

    const showReady = async (updateId: string, notify: boolean) => {
      if (cancelled) return;
      if (notify) await notifyAppUpdateReady();
      setReadyVisible(true);
      void updateId;
    };

    const boot = async () => {
      // Si ya había una update bajada de antes
      const existing = await getReadyUpdateId();
      if (existing) {
        await showReady(existing, false);
      }

      const prep = await prepareAvailableUpdate();
      if (cancelled) return;
      if (prep.available && prep.updateId) {
        await showReady(prep.updateId, Boolean(prep.shouldNotify));
      }
    };

    void boot();

    const stop = startUpdateAvailabilityWatcher((updateId) => {
      if (!cancelled) setReadyVisible(true);
      void updateId;
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, [skipUpdates]);

  const onLater = () => setReadyVisible(false);

  const onApply = async () => {
    setApplying(true);
    try {
      await applyPreparedUpdate();
    } catch {
      setApplying(false);
      setReadyVisible(true);
    }
  };

  return (
    <>
      {children}

      <Modal
        visible={readyVisible}
        transparent
        animationType="fade"
        onRequestClose={onLater}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.brand}>Finanzas</Text>
            <Text style={styles.title}>Actualización lista</Text>
            <Text style={styles.body}>
              Hay una versión nueva. Podés instalarla ahora o más tarde. Tus
              movimientos, metas y Ahorro no se borran.
            </Text>

            {applying ? (
              <View style={styles.busy}>
                <ActivityIndicator color="#3DDC97" />
                <Text style={styles.busyText}>Instalando…</Text>
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
