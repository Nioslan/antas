import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';

import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  clearError: () => void;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, displayName?: string) => Promise<void>;
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
        () => setLoading(false)
      );
      return unsub;
    } catch {
      setLoading(false);
      return undefined;
    }
  }, [configured]);

  const clearError = useCallback(() => setError(null), []);

  const signInEmail = useCallback(
    async (email: string, password: string) => {
      if (!configured) throw new Error('Firebase no configurado');
      try {
        await signInWithEmailAndPassword(
          getFirebaseAuth(),
          email.trim(),
          password
        );
        setError(null);
      } catch (err) {
        const msg = mapAuthError(err);
        setError(msg);
        throw new Error(msg);
      }
    },
    [configured]
  );

  const signUpEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      if (!configured) throw new Error('Firebase no configurado');
      try {
        const cred = await createUserWithEmailAndPassword(
          getFirebaseAuth(),
          email.trim(),
          password
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
    [configured]
  );

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
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
