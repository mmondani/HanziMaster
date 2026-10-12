import { UnreachableError, type AuthService, type AuthUser } from '@/lib/auth/auth-service';

/** Servicio de autenticación en memoria para tests. */
export class FakeAuthService implements AuthService {
  user: AuthUser | null;
  allowed = new Set<string>();
  unreachable = false;
  /** Cuenta que "elige" el usuario en el popup de Google. */
  nextAccount: AuthUser = { uid: 'u1', email: 'ana@gmail.com' };
  /** Si es una promesa, `signInWithGoogle` espera a que se resuelva (para ver el estado "Conectando"). */
  signInGate: Promise<void> | null = null;
  failSignIn = false;
  signInCalls = 0;
  private listeners = new Set<(user: AuthUser | null) => void>();

  constructor(user: AuthUser | null = null) {
    this.user = user;
  }

  subscribe(listener: (user: AuthUser | null) => void) {
    this.listeners.add(listener);
    queueMicrotask(() => { if (this.listeners.has(listener)) listener(this.user); });
    return () => { this.listeners.delete(listener); };
  }

  async signInWithGoogle() {
    this.signInCalls++;
    if (this.signInGate) await this.signInGate;
    if (this.failSignIn) throw new Error('popup cerrado');
    this.setUser(this.nextAccount);
  }

  async signOut() {
    this.setUser(null);
  }

  async isEmailAllowed(email: string) {
    if (this.unreachable) throw new UnreachableError();
    return this.allowed.has(email.toLowerCase());
  }

  private setUser(user: AuthUser | null) {
    this.user = user;
    this.listeners.forEach((l) => l(user));
  }
}
