import { Link, Navigate } from 'react-router-dom';
import { ChevronRight, Languages, LogOut } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { useAuth } from '@/lib/auth/auth-provider';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

/** G01 · Más (solo mobile): cuenta, acceso a Idiomas y cierre de sesión. */
export function MorePage() {
  const { state, signOut } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  // En desktop este contenido vive en el sidebar.
  if (isDesktop) return <Navigate to="/flashcards" replace />;
  if (state.status !== 'allowed') return null;
  const email = state.user.email;

  return (
    <div className="page narrow" style={{ '--w': '640px' } as React.CSSProperties}>
      <PageHeader title="Más" />
      <div className="stack" style={{ '--gap': 'var(--sp-5)' } as React.CSSProperties}>
        <section className="card" aria-label="Cuenta">
          <div className="row">
            <span className="avatar" style={{ width: 48, height: 48, fontSize: 16 }} aria-hidden="true">{email.slice(0, 2).toUpperCase()}</span>
            <div className="grow">
              <div className="small muted">Sesión iniciada con Google</div>
              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
            </div>
          </div>
        </section>

        <section aria-labelledby="cfg">
          <h2 id="cfg" className="side-label" style={{ padding: '0 0 var(--sp-2)' }}>Configuración</h2>
          <div className="list">
            <Link className="item" to="/idiomas">
              <span className="deck-icon"><Languages className="ic" aria-hidden="true" /></span>
              <span className="meta"><span className="t">Idiomas</span><span className="s">Campos, tags y layouts de las flashcards</span></span>
              <ChevronRight className="ic" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section aria-label="Sesión">
          <button type="button" className="btn btn-danger-ghost btn-block" style={{ border: '1.5px solid var(--border)' }} onClick={() => void signOut()}>
            <LogOut className="ic" aria-hidden="true" />Cerrar sesión
          </button>
        </section>
        <p className="xs muted" style={{ textAlign: 'center' }}>Hanzi Master · versión 0.1 (MVP)</p>
      </div>
    </div>
  );
}
