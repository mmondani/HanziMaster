import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Languages, Layers, Plus, Search } from 'lucide-react';
import { LanguageSelector } from '@/components/layout/language-selector';
import { PageHeader } from '@/components/layout/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useDecks } from '@/lib/decks/decks-provider';
import { getDeckStatus } from '@/lib/domain/deck-rules';
import { normalizeText } from '@/lib/domain/search';
import { useLanguages } from '@/lib/languages/languages-provider';
import { DeckCard } from './deck-card';
import { useStudyLauncher } from './use-study-launcher';

/** M01 · Listado de mazos del idioma activo. */
export function DecksPage() {
  const { languages, active, error: languagesError, retry: retryLanguages } = useLanguages();
  const { decks, error: decksError, retry: retryDecks } = useDecks();
  const [q, setQ] = useState('');
  const { start, dialog } = useStudyLauncher(active ?? undefined);

  const ofLanguage = useMemo(() => (decks ?? []).filter((d) => d.languageId === active?.id), [decks, active]);
  const visible = useMemo(() => {
    const needle = normalizeText(q);
    return needle ? ofLanguage.filter((d) => normalizeText(d.name).includes(needle)) : ofLanguage;
  }, [ofLanguage, q]);

  const newDeck = <Link className="btn btn-primary" to="/mazos/nuevo"><Plus className="ic" aria-hidden="true" />Nuevo mazo</Link>;

  let body;
  if (languagesError || decksError) {
    body = (
      <div className="stack" style={{ '--gap': 'var(--sp-3)' } as React.CSSProperties}>
        <Alert tone="err">No se pudieron cargar los mazos.</Alert>
        <Button variant="secondary" onClick={() => { retryLanguages(); retryDecks(); }}>Reintentar</Button>
      </div>
    );
  } else if (languages === null || decks === null) {
    body = (
      <div className="deck-grid section" role="status" aria-label="Cargando mazos">
        {[0, 1, 2].map((i) => <Skeleton key={i} height={168} />)}
      </div>
    );
  } else if (!active) {
    body = (
      <EmptyState
        icon={<Languages className="ic lg" />}
        title="Primero configura un idioma"
        description="Los mazos agrupan las flashcards de un idioma. Crea el primero para empezar."
        actions={<Link className="btn btn-primary" to="/idiomas/nuevo"><Plus className="ic" aria-hidden="true" />Nuevo idioma</Link>}
      />
    );
  } else if (ofLanguage.length === 0) {
    body = (
      <EmptyState
        icon={<Layers className="ic lg" />}
        title={`Aún no hay mazos en ${active.name}`}
        description="Un mazo agrupa las flashcards que quieres repasar juntas. Puedes crearlo eligiendo cartas a mano o desde la selección en Flashcards."
        actions={<Link className="btn btn-primary" to="/mazos/nuevo"><Plus className="ic" aria-hidden="true" />Crear mazo</Link>}
      />
    );
  } else {
    body = (
      <>
        <div className="stack" style={{ '--gap': 'var(--sp-3)' } as React.CSSProperties}>
          <div className="search">
            <Search className="ic" aria-hidden="true" />
            <input className="input" type="search" placeholder="Buscar mazo" aria-label="Buscar mazos" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <p className="small muted" aria-live="polite">{visible.length} {visible.length === 1 ? 'mazo' : 'mazos'}</p>
        </div>
        {visible.length === 0 ? (
          <EmptyState
            icon={<Search className="ic lg" />}
            title={`Sin resultados para “${q}”`}
            actions={<Button variant="secondary" onClick={() => setQ('')}>Limpiar búsqueda</Button>}
          />
        ) : (
          <ul className="deck-grid section" style={{ listStyle: 'none', padding: 0 }}>
            {visible.map((d) => (
              <li key={d.id}><DeckCard deck={d} status={getDeckStatus(d, active)} onStudy={() => start(d)} /></li>
            ))}
          </ul>
        )}
      </>
    );
  }

  return (
    <div className="page">
      <PageHeader title="Mazos" languageSelector={<LanguageSelector onSelect={() => setQ('')} />} action={newDeck} />
      {body}
      {active && (
        <Link className="fab only-mobile" to="/mazos/nuevo" aria-label="Nuevo mazo"><Plus className="ic lg" aria-hidden="true" /></Link>
      )}
      {dialog}
    </div>
  );
}
