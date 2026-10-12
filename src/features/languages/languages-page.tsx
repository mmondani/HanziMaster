import { Link } from 'react-router-dom';
import { ChevronRight, Languages, Plus } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { languageGlyph, languageSummary } from '@/lib/domain/language-presentation';
import { useLanguages } from '@/lib/languages/languages-provider';

/** I01 · Listado de idiomas. */
export function LanguagesPage() {
  const { languages, error, usage, retry } = useLanguages();

  return (
    <>
      <TopBar
        title="Idiomas"
        backTo="/mas"
        backLabel="Volver a Más"
        hideBackOnDesktop
        actions={
          <Link className="btn btn-secondary only-desktop" to="/idiomas/nuevo"><Plus className="ic" aria-hidden="true" />Nuevo idioma</Link>
        }
      />
      <div className="page narrow" style={{ '--w': '760px' } as React.CSSProperties}>
        <p className="muted" style={{ marginBottom: 'var(--sp-4)' }}>
          Cada idioma define qué campos tiene una flashcard y cómo se ve. Se configura una vez y rara vez se toca.
        </p>

        {error ? (
          <div className="stack" style={{ '--gap': 'var(--sp-3)' } as React.CSSProperties}>
            <Alert tone="err">No se pudieron cargar los idiomas.</Alert>
            <Button variant="secondary" onClick={retry}>Reintentar</Button>
          </div>
        ) : languages === null ? (
          <div className="list" role="status" aria-label="Cargando idiomas">
            <Skeleton height={64} /><Skeleton height={64} />
          </div>
        ) : languages.length === 0 ? (
          <EmptyState
            icon={<Languages className="ic lg" />}
            title="Todavía no configuraste ningún idioma"
            description="Crea el primero para empezar a armar flashcards."
            actions={<Link className="btn btn-primary" to="/idiomas/nuevo"><Plus className="ic" aria-hidden="true" />Nuevo idioma</Link>}
          />
        ) : (
          <ul className="list" style={{ listStyle: 'none', padding: 0 }}>
            {languages.map((l) => (
              <li key={l.id}>
                <Link className="item" to={`/idiomas/${l.id}`}>
                  <span className="deck-icon han" lang={l.code} style={{ fontSize: 22 }} aria-hidden="true">{languageGlyph(l)}</span>
                  <span className="meta"><span className="t">{l.name}</span><span className="s">{languageSummary(l, usage[l.id])}</span></span>
                  <ChevronRight className="ic" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link className="fab only-mobile" style={{ bottom: 'var(--sp-4)' }} to="/idiomas/nuevo" aria-label="Nuevo idioma">
        <Plus className="ic lg" aria-hidden="true" />
      </Link>
    </>
  );
}
