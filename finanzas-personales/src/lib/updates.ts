import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

export type UpdateCheckResult =
  | { status: 'dev'; message: string }
  | { status: 'unavailable'; message: string }
  | { status: 'upToDate'; message: string; current?: string }
  | { status: 'updated'; message: string }
  | { status: 'error'; message: string };

/**
 * Checks EAS Update for a new JS bundle, downloads it, and reloads the app.
 * Only works in release builds created with EAS (not Expo Go / Metro).
 */
export async function checkAndApplyUpdate(
  language: 'es' | 'en' = 'es'
): Promise<UpdateCheckResult> {
  const es = language === 'es';

  // Expo Go / local Metro: updates API is disabled
  if (__DEV__ || Constants.appOwnership === 'expo') {
    return {
      status: 'dev',
      message: es
        ? 'Las actualizaciones desde la app funcionan en la versión descargada (APK/AAB), no en Expo Go ni en desarrollo. Cuando tengamos un build instalado, este botón bajará las mejoras solas.'
        : 'In-app updates work on the downloaded release build (APK/AAB), not in Expo Go or development. Once you install a build, this button will download improvements.',
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
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) {
      return {
        status: 'upToDate',
        message: es
          ? 'Ya tenés la última versión disponible.'
          : 'You already have the latest version.',
        current: Updates.updateId ?? undefined,
      };
    }

    await Updates.fetchUpdateAsync();
    // Reload applies the new bundle
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
