import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/** Usuario local (sin Firebase en el arranque). */
export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  clearError: () => void;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LOCAL_MSG =
  'Esta versión guarda todo en el teléfono. El login en la nube está desactivado.';

/**
 * Auth local-only: no importa Firebase (evita pantalla negra al abrir).
 * La API queda por si más adelante se reactiva sync.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const signInEmail = useCallback(async () => {
    setError(LOCAL_MSG);
    throw new Error(LOCAL_MSG);
  }, []);

  const signUpEmail = useCallback(async () => {
    setError(LOCAL_MSG);
    throw new Error(LOCAL_MSG);
  }, []);

  const logout = useCallback(async () => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user: null,
      loading: false,
      configured: false,
      error,
      clearError,
      signInEmail,
      signUpEmail,
      logout,
    }),
    [error, clearError, signInEmail, signUpEmail, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
