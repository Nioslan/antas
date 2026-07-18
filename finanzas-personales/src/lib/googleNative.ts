import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import { googleWebClientId } from './firebaseConfig';

type GoogleSigninModule = {
  GoogleSignin: {
    configure: (opts: { webClientId: string; offlineAccess?: boolean }) => void;
    hasPlayServices: (opts?: {
      showPlayServicesUpdateDialog?: boolean;
    }) => Promise<boolean>;
    signIn: () => Promise<
      | { type: 'success'; data: { idToken: string | null } }
      | { type: 'cancelled' }
      | { data?: { idToken?: string | null }; idToken?: string | null }
    >;
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

function hasNativeBridge(): boolean {
  try {
    if (NativeModules.RNGoogleSignin) return true;
    const turbo = TurboModuleRegistry.get('RNGoogleSignin');
    return turbo != null;
  } catch {
    return false;
  }
}

function loadModule(): GoogleSigninModule | null {
  if (cached !== undefined) return cached;
  if (Platform.OS === 'web') {
    cached = null;
    return null;
  }
  if (!hasNativeBridge()) {
    cached = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
  } catch {
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

/**
 * Abre el selector de cuenta de Google y devuelve el idToken para Firebase.
 * null = el usuario canceló.
 */
export async function signInWithGoogleNative(): Promise<string | null> {
  const mod = loadModule();
  if (!mod) {
    throw new Error(
      'Este APK todavía no tiene Google nativo. Instalá la versión nueva de la app (link abajo / Ajustes).'
    );
  }
  if (!googleWebClientId) {
    throw new Error('Falta el Web Client ID de Google en la configuración.');
  }

  ensureConfigured(mod);
  await mod.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  try {
    const result = await mod.GoogleSignin.signIn();

    if (result && typeof result === 'object' && 'type' in result) {
      if (result.type === 'cancelled') return null;
      if (result.type === 'success') {
        const token = result.data?.idToken ?? null;
        if (!token) {
          throw new Error(
            'Google no devolvió un token. En Firebase → Project settings → tu app Android, agregá el SHA-1.'
          );
        }
        return token;
      }
    }

    const legacy = result as {
      idToken?: string | null;
      data?: { idToken?: string | null };
    };
    const token = legacy?.data?.idToken ?? legacy?.idToken ?? null;
    if (!token) {
      throw new Error(
        'Google no devolvió un token. En Firebase → Project settings → tu app Android, agregá el SHA-1.'
      );
    }
    return token;
  } catch (err) {
    if (mod.isErrorWithCode(err)) {
      const code = String((err as { code: string }).code);
      if (code === mod.statusCodes.SIGN_IN_CANCELLED) return null;
      if (code === mod.statusCodes.IN_PROGRESS) {
        throw new Error('Ya hay un inicio de sesión con Google en curso.');
      }
      if (code === mod.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error(
          'Google Play Services no está disponible en este teléfono.'
        );
      }
      if (code === '10' || code === 'DEVELOPER_ERROR') {
        throw new Error(
          'Configuración de Google incompleta. En Firebase → Project settings → Android (com.finanzas.personales) agregá el SHA-1 del APK y esperá unos minutos.'
        );
      }
    }
    throw err;
  }
}
