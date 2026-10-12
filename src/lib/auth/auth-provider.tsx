import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { UnreachableError, type AuthService, type AuthUser } from './auth-service';

export type AuthState =
  | { status: 'loading' }
  /** Sin sesión. `deniedEmail`: la cuenta intentó ingresar sin estar habilitada. `error`: falló el ingreso. */
  | { status: 'signedOut'; deniedEmail?: string; error?: boolean }
  /** Hay sesión pero no se pudo validar la cuenta por falta de conexión (A03). */
  | { status: 'unreachable' }
  | { status: 'allowed'; user: AuthUser };

export interface AuthContextValue {
  state: AuthState;
  /** Mientras el flujo de Google (y la validación posterior) está en curso. */
  signingIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Vuelve a validar la cuenta (A03). */
  retry: () => void;
  /** Olvida la cuenta denegada para poder volver a /login (A02-3). */
  clearDenied: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

export function AuthProvider({ service, children }: { service: AuthService; children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const [signingIn, setSigningIn] = useState(false);
  const currentUser = useRef<AuthUser | null>(null);
  const checkId = useRef(0);

  const validate = useCallback(
    async (user: AuthUser) => {
      const id = ++checkId.current;
      const stale = () => id !== checkId.current;
      try {
        const allowed = await service.isEmailAllowed(user.email);
        if (stale()) return;
        if (allowed) {
          setState({ status: 'allowed', user });
        } else {
          setState({ status: 'signedOut', deniedEmail: user.email });
          setSigningIn(false);
          await service.signOut();
        }
      } catch (error) {
        if (stale()) return;
        if (error instanceof UnreachableError) {
          setState({ status: 'unreachable' });
        } else {
          setState({ status: 'signedOut', error: true });
          setSigningIn(false);
          await service.signOut().catch(() => undefined);
        }
      } finally {
        if (!stale()) setSigningIn(false);
      }
    },
    [service],
  );

  useEffect(() => {
    return service.subscribe((user) => {
      currentUser.current = user;
      if (user) {
        void validate(user);
      } else {
        checkId.current++;
        // Conserva deniedEmail/error si el cierre de sesión fue provocado por la validación.
        setState((prev) => (prev.status === 'signedOut' ? prev : { status: 'signedOut' }));
      }
    });
  }, [service, validate]);

  const retry = useCallback(() => {
    if (currentUser.current) void validate(currentUser.current);
  }, [validate]);

  useEffect(() => {
    if (state.status !== 'unreachable') return;
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [state.status, retry]);

  const signIn = useCallback(async () => {
    setSigningIn(true);
    setState({ status: 'signedOut' });
    try {
      await service.signInWithGoogle();
      // La validación continúa en el listener de sesión, que apaga `signingIn`.
    } catch {
      setState({ status: 'signedOut', error: true });
      setSigningIn(false);
    }
  }, [service]);

  const signOut = useCallback(() => service.signOut(), [service]);
  const clearDenied = useCallback(() => setState({ status: 'signedOut' }), []);

  const value = useMemo(
    () => ({ state, signingIn, signIn, signOut, retry, clearDenied }),
    [state, signingIn, signIn, signOut, retry, clearDenied],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
