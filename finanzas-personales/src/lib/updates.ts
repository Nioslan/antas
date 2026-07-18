import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

export type UpdateCheckResult =
  | { status: 'dev'; message: string }
  | { status: 'unavailable'; message: string }
  | { status: 'upToDate'; message: string; current?: string }
  | { status: 'updated'; message: string }
  | { status: 'error'; message: string };

export type UpdateProgress = {
  phase: 'checking' | 'downloading' | 'applying';
  progress: number; // 0..1
  message: string;
};

/**
 * Checks EAS Update for a new JS bundle, downloads it, and reloads the app.
 * Only works in release builds created with EAS (not Expo Go / Metro).
 */
export async function checkAndApplyUpdate(
  language: 'es' | 'en' = 'es',
  onProgress?: (p: UpdateProgress) => void
): Promise<UpdateCheckResult> {
  const es = language === 'es';

  if (__DEV__ || Constants.appOwnership === 'expo') {
    return {
      status: 'dev',
      message: es
        ? 'Las actualizaciones desde la app funcionan en la versión descargada (APK/AAB), no en Expo Go ni en desarrollo.'
        : 'In-app updates work on the downloaded release build (APK/AAB), not in Expo Go or development.',
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

    await Updates.fetchUpdateAsync();
    clearInterval(tick);

    onProgress?.({
      phase: 'applying',
      progress: 1,
      message: es ? 'Activando actualización…' : 'Applying update…',
    });

    await new Promise((r) => setTimeout(r, 400));
    await Updates.reloadAsync();
    return {
      status: 'updated',
      message: es
        ? 'Actualización instalada. Reiniciando…'
        : 'Update installed. Reloading…',
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

export function getUpdateMeta() {
  return {
    channel: Updates.channel ?? '—',
    runtimeVersion: Updates.runtimeVersion ?? '—',
    updateId: Updates.updateId ?? '—',
    isEmbedded: Updates.isEmbeddedLaunch,
  };
}
