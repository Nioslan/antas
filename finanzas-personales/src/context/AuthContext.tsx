import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { googleWebClientId } from '../lib/firebaseConfig';

WebBrowser.maybeCompleteAuthSession();

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  clearError: () => void;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err && 'code' in err
      ? String((err as { code: string }).code)
      : '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Email inválido.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email o contraseña incorrectos.';
    case 'auth/email-already-in-use':
      return 'Ese email ya tiene una cuenta.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Probá de nuevo cuando haya internet.';
    case 'auth/operation-not-allowed':
      return 'Este método de login no está habilitado en Firebase.';
    case 'auth/unauthorized-domain':
      return 'Este dominio no está autorizado en Firebase.';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana de Google. Permití popups e intentá de nuevo.';
    case 'auth/popup-closed-by-user':
      return 'Cerraste la ventana de Google antes de terminar.';
    default:
      if (err instanceof Error && err.message) return err.message;
      return 'No se pudo completar el acceso.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId:
      googleWebClientId ||
      '812081659477-placeholder.apps.googleusercontent.com',
    iosClientId: googleWebClientId,
    androidClientId: googleWebClientId,
  });

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    try {
      const auth = getFirebaseAuth();
      const unsub = onAuthStateChanged(
        auth,
        (next) => {
          setUser(next);
          setLoading(false);
        },
        () => setLoading(false),
      );
      return unsub;
    } catch {
      setLoading(false);
      return undefined;
    }
  }, [configured]);

  useEffect(() => {
    if (!configured) return;
    if (response?.type !== 'success') return;

    const idToken =
      response.authentication?.idToken ??
      (response.params as { id_token?: string })?.id_token;

    if (!idToken) {
      setError('Google no devolvió un token válido.');
      return;
    }

    (async () => {
      try {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(getFirebaseAuth(), credential);
        setError(null);
      } catch (err) {
        setError(mapAuthError(err));
      }
    })();
  }, [configured, response]);

  const clearError = useCallback(() => setError(null), []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    if (!configured) throw new Error('Firebase no configurado');
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      setError(null);
    } catch (err) {
      const msg = mapAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  }, [configured]);

  const signUpEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      if (!configured) throw new Error('Firebase no configurado');
      try {
        const cred = await createUserWithEmailAndPassword(
          getFirebaseAuth(),
          email.trim(),
          password,
        );
        if (displayName?.trim()) {
          await updateProfile(cred.user, { displayName: displayName.trim() });
        }
        setError(null);
      } catch (err) {
        const msg = mapAuthError(err);
        setError(msg);
        throw new Error(msg);
      }
    },
    [configured],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!configured) throw new Error('Firebase no configurado');
    setError(null);

    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(getFirebaseAuth(), provider);
        return;
      }

      if (!googleWebClientId) {
        throw new Error(
          'Falta el Web client ID de Google en Firebase. En Authentication → Google copiá el “Web client ID”.',
        );
      }
      if (!request) {
        throw new Error('Google Sign-In todavía no está listo. Probá de nuevo.');
      }
      await promptAsync();
    } catch (err) {
      const msg = mapAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  }, [configured, promptAsync, request]);

  const logout = useCallback(async () => {
    if (!configured) return;
    await signOut(getFirebaseAuth());
    setError(null);
  }, [configured]);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured,
      error,
      clearError,
      signInEmail,
      signUpEmail,
      signInWithGoogle,
      logout,
    }),
    [
      user,
      loading,
      configured,
      error,
      clearError,
      signInEmail,
      signUpEmail,
      signInWithGoogle,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
