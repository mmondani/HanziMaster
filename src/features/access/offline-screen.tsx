import { Undo2, WifiOff } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-provider';
import { Button } from '@/components/ui/button';

/** A03 · Sin conexión (pantalla completa): la app no puede validar la sesión sin red. */
export function OfflineScreen() {
  const { retry } = useAuth();
  return (
    <main className="center-screen">
      <div className="login-card">
        <div className="empty" style={{ padding: 0 }}>
          <div className="art" aria-hidden="true"><WifiOff className="ic lg" /></div>
          <h1>Sin conexión</h1>
          <p>Hanzi Master necesita internet para ingresar y sincronizar tus flashcards. Revisa tu conexión e inténtalo de nuevo.</p>
        </div>
        <div className="stack" style={{ '--gap': 'var(--sp-3)' } as React.CSSProperties}>
          <Button large block onClick={retry}><Undo2 className="ic" aria-hidden="true" />Reintentar</Button>
          <p className="small muted">Si ya habías abierto la app antes, tus flashcards guardadas siguen disponibles en este dispositivo.</p>
        </div>
      </div>
    </main>
  );
}
