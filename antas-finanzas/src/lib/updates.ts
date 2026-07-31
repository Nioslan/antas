import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type UpdateCheckResult =
  | { status: 'dev'; message: string }
  | { status: 'unavailable'; message: string }
  | { status: 'upToDate'; message: string; current?: string }
  | { status: 'readyToApply'; message: string; updateId?: string }
  | { status: 'updated'; message: string }
  | { status: 'error'; message: string };

export type UpdateProgress = {
  phase: 'checking' | 'downloading' | 'applying';
  progress: number;
  message: string;
};

export type PreparedUpdate = {
  available: boolean;
  updateId?: string;
  shouldNotify?: boolean;
};

export const TESTERS_UPDATE_CHANNEL = 'preview';

/**
 * 1.9.0: updates desactivadas en el binario para estabilizar Android.
 * No importa expo-updates (nativo).
 */
export function updatesAreSupported(): boolean {
  return false;
}

export async function markUpdateReady(_updateId: string): Promise<void> {}

export async function getReadyUpdateId(): Promise<string | null> {
  return null;
}

export async function clearUpdateReadyMark(): Promise<void> {}

export async function resetUpdateMarks(): Promise<void> {}

export async function prepareAvailableUpdate(): Promise<PreparedUpdate> {
  return { available: false };
}

export async function applyPreparedUpdate(): Promise<true> {
  throw new Error('Actualizaciones desactivadas en esta versión. Instalá el APK nuevo.');
}

export async function checkAndPrepareUpdate(
  language: 'es' | 'en' = 'es',
  onProgress?: (p: UpdateProgress) => void,
  _options?: { force?: boolean }
): Promise<UpdateCheckResult> {
  const es = language === 'es';
  onProgress?.({
    phase: 'checking',
    progress: 1,
    message: es
      ? 'En esta versión las updates van por APK nuevo.'
      : 'This build uses APK installs only.',
  });
  return {
    status: 'unavailable',
    message: es
      ? 'Las actualizaciones automáticas están apagadas en esta versión estable. Cuando haya mejoras te pasamos un APK nuevo. Tus datos no se borran si instalás encima.'
      : 'Automatic updates are off in this stable build. Install a new APK when available.',
  };
}

export async function checkAndApplyUpdate(
  language: 'es' | 'en' = 'es',
  onProgress?: (p: UpdateProgress) => void
): Promise<UpdateCheckResult> {
  return checkAndPrepareUpdate(language, onProgress);
}

export function startUpdateAvailabilityWatcher(
  _onReady: (updateId: string) => void
): () => void {
  return () => undefined;
}

export function getUpdateMeta() {
  return {
    channel: 'apk-only',
    runtimeVersion: Constants.expoConfig?.version ?? '—',
    updateId: '—',
    isEmbedded: true,
    platform: Platform.OS,
  };
}
