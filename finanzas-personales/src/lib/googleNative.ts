import { Platform } from 'react-native';
import { ANDROID_SHA1 } from './apk';
import { googleWebClientId } from './firebaseConfig';

type GoogleUser = {
  idToken: string | null;
};

type GoogleSigninModule = {
  GoogleSignin: {
    configure: (opts: { webClientId: string; offlineAccess?: boolean }) => void;
    hasPlayServices: (opts?: {
      showPlayServicesUpdateDialog?: boolean;
    }) => Promise<boolean>;
    signIn: () => Promise<
      | { type: 'success'; data: GoogleUser }
      | { type: 'cancelled' }
    >;
    getTokens: () => Promise<{ idToken: string; accessToken: string }>;
  };
  isErrorWithCode: (err: unknown) => boolean;
  statusCodes: {
    SIGN_IN_CANCELLED: string;
    IN_PROGRESS: string;
    PLAY_SERVICES_NOT_AVAILABLE: string;
  };
};

let cached: GoogleSigninModule | null | undefined;
let configured = false;

function loadModule(): GoogleSigninModule | null {
  if (cached !== undefined) return cached;
  if (Platform.OS === 'web') {
    cached = null;
    return null;
  }
  try {
    // No chequear NativeModules antes: en New Architecture a veces
    // el bridge no aparece hasta que se hace require().
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
    if (!mod?.GoogleSignin?.signIn) {
      cached = null;
      return null;
    }
    cached = mod;
  } catch (err) {
    console.warn('GoogleSignin require failed', err);
    cached = null;
  }
  return cached;
}

export function isNativeGoogleSignInAvailable(): boolean {
  return loadModule() != null && Boolean(googleWebClientId);
}

function ensureConfigured(mod: GoogleSigninModule): void {
  if (configured) return;
  mod.GoogleSignin.configure({
    webClientId: googleWebClientId,
    offlineAccess: false,
  });
  configured = true;
}

function sha1Help(): string {
  return (
    `Firebase → Project settings → Android (com.llc.finanzaspersonales) → Add fingerprint:\n` +
    `${ANDROID_SHA1}\n` +
    `Guardá, esperá 5 minutos y volvé a intentar.`
  );
}

/**
 * Abre el selector de cuenta de Google y devuelve el idToken para Firebase.
 * null = el usuario canceló.
 */
export async function signInWithGoogleNative(): Promise<string | null> {
  const mod = loadModule();
  if (!mod) {
    throw new Error(
      'Este APK no tiene Google nativo. Instalá el APK nuevo (no alcanza con “Buscar actualizaciones”).'
    );
  }
  if (!googleWebClientId) {
    throw new Error('Falta el Web Client ID de Google en la configuración.');
  }

  ensureConfigured(mod);

  try {
    await mod.GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
  } catch (err) {
    throw new Error(
      `Google Play Services no está listo: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  try {
    const result = await mod.GoogleSignin.signIn();

    if (result?.type === 'cancelled') return null;

    let idToken: string | null = null;
    if (result?.type === 'success') {
      idToken = result.data?.idToken ?? null;
    }

    if (!idToken) {
      try {
        const tokens = await mod.GoogleSignin.getTokens();
        idToken = tokens.idToken ?? null;
      } catch {
        // ignore
      }
    }

    if (!idToken) {
      throw new Error(
        `Google no devolvió idToken. Casi seguro falta el SHA-1.\n\n${sha1Help()}`
      );
    }
    return idToken;
  } catch (err) {
    if (err instanceof Error && err.message.includes('SHA-1')) {
      throw err;
    }

    if (mod.isErrorWithCode(err)) {
      const code = String((err as { code: string }).code);
      if (code === mod.statusCodes.SIGN_IN_CANCELLED || code === '12501') {
        return null;
      }
      if (code === mod.statusCodes.IN_PROGRESS) {
        throw new Error('Ya hay un inicio de sesión con Google en curso.');
      }
      if (code === mod.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error(
          'Google Play Services no está disponible en este teléfono.'
        );
      }
      if (
        code === '10' ||
        code === 'DEVELOPER_ERROR' ||
        code === '12500' ||
        code.toLowerCase().includes('developer')
      ) {
        throw new Error(
          `Error de configuración Google (${code}).\n\n${sha1Help()}`
        );
      }
      throw new Error(
        `Google error ${code}: ${
          err instanceof Error ? err.message : String(err)
        }\n\n${sha1Help()}`
      );
    }

    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`${msg}\n\n${sha1Help()}`);
  }
}
