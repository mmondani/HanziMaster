import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth/auth-provider';
import { Alert } from '@/components/ui/alert';
import { GoogleLogo } from './google-logo';

/** A01 · Ingreso con Google. */
export function LoginPage() {
  const { state, signingIn, signIn } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/flashcards';
  const denied = state.status === 'signedOut' ? state.deniedEmail : undefined;

  useEffect(() => {
    if (denied) navigate('/acceso-denegado', { replace: true });
  }, [denied, navigate]);

  if (state.status === 'allowed') return <Navigate to={from} replace />;

  return (
    <main className="center-screen">
      <div className="login-card">
        <div>
          <div className="brand-mark han" aria-hidden="true">汉</div>
          <h1 style={{ marginTop: 'var(--sp-4)', fontSize: 28 }}>Hanzi Master</h1>
          <p className="muted" style={{ marginTop: 'var(--sp-2)' }}>
            Flashcards a tu medida para aprender chino, japonés o el idioma que elijas.
          </p>
        </div>

        <div className="stack" style={{ '--gap': 'var(--sp-3)' } as React.CSSProperties}>
          <button type="button" className="btn btn-google btn-block" onClick={() => void signIn()} disabled={signingIn} aria-busy={signingIn || undefined}>
            {signingIn ? <Spinner /> : <GoogleLogo />}
            {signingIn ? 'Conectando con Google…' : 'Ingresar con Google'}
          </button>
          {state.status === 'signedOut' && state.error && !signingIn && (
            <Alert tone="err">No se pudo completar el ingreso. Revisa tu conexión e inténtalo de nuevo.</Alert>
          )}
        </div>

        <p className="small muted">Solo pueden ingresar las cuentas habilitadas. Tus flashcards son privadas: nadie más puede verlas.</p>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" opacity=".25" />
      <path d="M21 12a9 9 0 0 0-9-9">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.9s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}
