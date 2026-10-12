import { Link, Navigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-provider';

/** A02 · Acceso denegado. */
export function AccessDeniedPage() {
  const { state, clearDenied } = useAuth();
  const email = state.status === 'signedOut' ? state.deniedEmail : undefined;

  // A02-4: sin un intento de ingreso previo no hay nada que mostrar.
  if (!email) return <Navigate to="/login" replace />;

  return (
    <main className="center-screen">
      <div className="login-card">
        <div className="empty" style={{ padding: 0 }}>
          <div className="art" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }} aria-hidden="true">
            <Lock className="ic lg" />
          </div>
          <h1>Esta cuenta no tiene acceso</h1>
          <p>
            La cuenta <strong style={{ color: 'var(--text)' }}>{email}</strong> no está habilitada para usar Hanzi Master.
          </p>
        </div>
        <div className="stack" style={{ '--gap': 'var(--sp-3)' } as React.CSSProperties}>
          <Link className="btn btn-primary btn-lg btn-block" to="/login" onClick={clearDenied}>
            Probar con otra cuenta
          </Link>
          <p className="small muted">Si crees que es un error, pide que agreguen tu email a la lista de cuentas autorizadas.</p>
        </div>
      </div>
    </main>
  );
}
