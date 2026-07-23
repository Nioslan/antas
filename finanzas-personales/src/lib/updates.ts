import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { notifyAppUpdateReady } from './notifications';

export type UpdateCheckResult =
  | { status: 'dev'; message: string }
  | { status: 'unavailable'; message: string }
  | { status: 'upToDate'; message: string; current?: string }
  | { status: 'readyToApply'; message: string; updateId?: string }
  | { status: 'updated'; message: string }
  | { status: 'error'; message: string };

export type UpdateProgress = {
  phase: 'checking' | 'downloading' | 'applying';
  progress: number; // 0..1
  message: string;
};

export type PreparedUpdate = {
  available: boolean;
  updateId?: string;
  /** true si es la primera vez que avisamos por esta update */
  shouldNotify?: boolean;
};

/** Canal fijo de las pruebas con amigos (EAS preview). */
export const TESTERS_UPDATE_CHANNEL = 'preview';

const READY_KEY = 'finanzas_update_ready_id';
const NOTIFIED_KEY = 'finanzas_update_notified_id';

export function updatesAreSupported(): boolean {
  return (
    !__DEV__ &&
    Constants.appOwnership !== 'expo' &&
    Updates.isEnabled
  );
}

function resolveUpdateId(fetched?: { manifest?: unknown }): string {
  const fromUpdates = Updates.updateId;
  if (fromUpdates) return fromUpdates;
  const manifest = fetched?.manifest as { id?: string } | undefined;
  if (manifest?.id) return String(manifest.id);
  return `upd_${Date.now().toString(36)}`;
}

/** Marca en disco que hay una update lista (para mostrar el aviso). */
export async function markUpdateReady(updateId: string): Promise<void> {
  await AsyncStorage.setItem(READY_KEY, updateId);
}

export async function getReadyUpdateId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(READY_KEY);
  } catch {
    return null;
  }
}

export async function clearUpdateReadyMark(): Promise<void> {
  try {
    await AsyncStorage.removeItem(READY_KEY);
  } catch {
    // ignore
  }
}

/**
 * Busca y descarga la update, pero NO reinicia.
 * El usuario decide cuándo aplicar (reload).
 * OTA = solo JS; los datos del teléfono no se borran.
 */
export async function prepareAvailableUpdate(): Promise<PreparedUpdate> {
  if (!updatesAreSupported()) return { available: false };

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) {
      await clearUpdateReadyMark();
      return { available: false };
    }

    const fetched = await Updates.fetchUpdateAsync();
    if (!fetched.isNew) {
      // Puede que ya esté descargada de antes
      const existing = await getReadyUpdateId();
      if (existing) {
        return { available: true, updateId: existing, shouldNotify: false };
      }
      return { available: false };
    }

    const updateId = resolveUpdateId(fetched);
    await markUpdateReady(updateId);

    let shouldNotify = true;
    try {
      const notified = await AsyncStorage.getItem(NOTIFIED_KEY);
      shouldNotify = notified !== updateId;
      if (shouldNotify) {
        await AsyncStorage.setItem(NOTIFIED_KEY, updateId);
      }
    } catch {
      shouldNotify = true;
    }

    return { available: true, updateId, shouldNotify };
  } catch {
    return { available: false };
  }
}

/** Aplica la update ya descargada (reinicia la app). Datos intactos. */
export async function applyPreparedUpdate(): Promise<void> {
  await clearUpdateReadyMark();
  await Updates.reloadAsync();
}

/**
 * Checks EAS Update, downloads it, and deja listo para que el usuario confirme.
 * Solo aplica sola si onProgress termina en applying y el caller decide.
 */
export async function checkAndPrepareUpdate(
  language: 'es' | 'en' = 'es',
  onProgress?: (p: UpdateProgress) => void
): Promise<UpdateCheckResult> {
  const es = language === 'es';

  if (__DEV__ || Constants.appOwnership === 'expo') {
    return {
      status: 'dev',
      message: es
        ? 'Las actualizaciones desde la app funcionan en la versión descargada (APK), no en Expo Go ni en desarrollo.'
        : 'In-app updates work on the downloaded release build (APK), not in Expo Go or development.',
    };
  }

  if (!Updates.isEnabled) {
    return {
      status: 'unavailable',
      message: es
        ? 'Las actualizaciones no están activas en este build. Hay que generar la app con EAS Build.'
        : 'Updates are not enabled on this build. Create the app with EAS Build first.',
    };
  }

  try {
    onProgress?.({
      phase: 'checking',
      progress: 0.08,
      message: es ? 'Buscando actualización…' : 'Checking for update…',
    });

    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) {
      await clearUpdateReadyMark();
      onProgress?.({
        phase: 'checking',
        progress: 1,
        message: es ? 'Ya tenés la última versión.' : 'Already up to date.',
      });
      return {
        status: 'upToDate',
        message: es
          ? 'Ya tenés la última versión disponible.'
          : 'You already have the latest version.',
        current: Updates.updateId ?? undefined,
      };
    }

    onProgress?.({
      phase: 'downloading',
      progress: 0.2,
      message: es ? 'Descargando actualización…' : 'Downloading update…',
    });

    let fake = 0.2;
    const tick = setInterval(() => {
      fake = Math.min(0.85, fake + 0.04);
      onProgress?.({
        phase: 'downloading',
        progress: fake,
        message: es ? 'Descargando actualización…' : 'Downloading update…',
      });
    }, 350);

    const fetched = await Updates.fetchUpdateAsync();
    clearInterval(tick);

    if (!fetched.isNew) {
      const existing = await getReadyUpdateId();
      if (existing) {
        onProgress?.({
          phase: 'applying',
          progress: 1,
          message: es ? 'Actualización lista.' : 'Update ready.',
        });
        return {
          status: 'readyToApply',
          message: es
            ? 'Hay una actualización lista. ¿Querés instalarla ahora? Tus datos no se borran.'
            : 'An update is ready. Install now? Your data is kept.',
          updateId: existing,
        };
      }
      return {
        status: 'upToDate',
        message: es
          ? 'Ya tenés la última versión disponible.'
          : 'You already have the latest version.',
      };
    }

    const updateId = resolveUpdateId(fetched);
    await markUpdateReady(updateId);

    onProgress?.({
      phase: 'applying',
      progress: 1,
      message: es ? 'Actualización lista.' : 'Update ready.',
    });

    return {
      status: 'readyToApply',
      message: es
        ? 'Hay una actualización lista. ¿Querés instalarla ahora? Tus datos no se borran.'
        : 'An update is ready. Install now? Your data is kept.',
      updateId,
    };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return {
      status: 'error',
      message: es
        ? `No se pudo actualizar (${Platform.OS}): ${detail}`
        : `Could not update (${Platform.OS}): ${detail}`,
    };
  }
}

/** @deprecated usar checkAndPrepareUpdate + applyPreparedUpdate */
export async function checkAndApplyUpdate(
  language: 'es' | 'en' = 'es',
  onProgress?: (p: UpdateProgress) => void
): Promise<UpdateCheckResult> {
  return checkAndPrepareUpdate(language, onProgress);
}

/**
 * Revisa updates en segundo plano:
 * - descarga si hay
 * - manda notificación (una vez por update)
 * - avisa al UI para que el usuario elija cuándo instalar
 */
export function startUpdateAvailabilityWatcher(
  onReady: (updateId: string) => void
): () => void {
  if (!updatesAreSupported()) return () => undefined;

  let lastCheck = 0;
  let running = false;
  const MIN_MS = 90 * 1000;
  const PERIODIC_MS = 15 * 60 * 1000;

  const runCheck = () => {
    const now = Date.now();
    if (running || now - lastCheck < MIN_MS) return;
    lastCheck = now;
    running = true;
    void (async () => {
      try {
        const prep = await prepareAvailableUpdate();
        if (!prep.available || !prep.updateId) return;
        if (prep.shouldNotify) {
          await notifyAppUpdateReady();
        }
        onReady(prep.updateId);
      } finally {
        running = false;
      }
    })();
  };

  const onChange = (state: AppStateStatus) => {
    if (state === 'active') runCheck();
  };

  const bootTimer = setTimeout(runCheck, 2500);
  const periodic = setInterval(() => {
    if (AppState.currentState === 'active') runCheck();
  }, PERIODIC_MS);

  const sub = AppState.addEventListener('change', onChange);
  return () => {
    clearTimeout(bootTimer);
    clearInterval(periodic);
    sub.remove();
  };
}

export function getUpdateMeta() {
  return {
    channel: Updates.channel ?? '—',
    runtimeVersion: Updates.runtimeVersion ?? '—',
    updateId: Updates.updateId ?? '—',
    isEmbedded: Updates.isEmbeddedLaunch,
  };
}
