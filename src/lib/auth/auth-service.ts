export interface AuthUser {
  uid: string;
  email: string;
}

/** No se pudo consultar el servidor (sin red y sin caché local). */
export class UnreachableError extends Error {
  constructor() {
    super('No se pudo conectar con el servidor');
    this.name = 'UnreachableError';
  }
}

/** Contrato que usa la app para autenticar; la implementación real usa Firebase, los tests una simulada. */
export interface AuthService {
  /** Notifica la sesión actual (y sus cambios). Devuelve la función para cancelar la suscripción. */
  subscribe(listener: (user: AuthUser | null) => void): () => void;
  /** Abre el flujo de Google (popup). Rechaza si se cancela o falla. */
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  /** ¿El email figura en la colección de cuentas habilitadas? Lanza `UnreachableError` si no puede saberse. */
  isEmailAllowed(email: string): Promise<boolean>;
}
