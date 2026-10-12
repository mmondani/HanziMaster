import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Copy, Languages, Plus, Search } from 'lucide-react';
import { LanguageSelector } from '@/components/layout/language-selector';
import { PageHeader } from '@/components/layout/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { sortFields } from '@/lib/domain/field-rules';
import { filterFlashcards } from '@/lib/domain/search';
import { useFlashcards } from '@/lib/flashcards/flashcards-provider';
import { useLanguages } from '@/lib/languages/languages-provider';
import { FlashcardRow } from './flashcard-row';

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 200;

/** F01 · Listado de flashcards del idioma activo, con búsqueda en vivo y filtro por tag. */
export function FlashcardsPage() {
  const { languages, active, error: languagesError, retry: retryLanguages } = useLanguages();
  const { flashcards, error: cardsError, retry: retryCards } = useFlashcards();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const tagParam = params.get('tag') ?? '';

  const [text, setText] = useState(q);
  const [limit, setLimit] = useState<{ key: string; size: number }>({ key: '', size: PAGE_SIZE });

  // El texto del buscador se refleja en la URL (?q=) con un pequeño retardo.
  useEffect(() => {
    if (text === q) return;
    const id = setTimeout(() => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (text) next.set('q', text); else next.delete('q');
        return next;
      }, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [text, q, setParams]);

  const tag = active?.tags.includes(tagParam) ? tagParam : '';
  const ofLanguage = useMemo(() => (active && flashcards ? filterFlashcards(flashcards, active) : []), [active, flashcards]);
  const visible = useMemo(() => (active && flashcards ? filterFlashcards(flashcards, active, { q, tag }) : []), [active, flashcards, q, tag]);
  const secondary = active ? sortFields(active.fields).find((f) => !f.system && f.type === 'text') : undefined;

  const key = `${active?.id}|${q}|${tag}`;
  const size = limit.key === key ? limit.size : PAGE_SIZE;
  const shown = visible.slice(0, size);

  function setTag(next: string) {
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      if (next) p.set('tag', next); else p.delete('tag');
      return p;
    }, { replace: true });
  }

  function clearFilters() {
    setText('');
    setParams({}, { replace: true });
  }

  const header = (
    <PageHeader
      title="Flashcards"
      languageSelector={<LanguageSelector onSelect={clearFilters} />}
      action={<Link className="btn btn-primary" to="/flashcards/nueva"><Plus className="ic" aria-hidden="true" />Nueva flashcard</Link>}
    />
  );

  let body;
  if (languagesError || cardsError) {
    body = (
      <div className="stack" style={{ '--gap': 'var(--sp-3)' } as React.CSSProperties}>
        <Alert tone="err">No se pudieron cargar las flashcards.</Alert>
        <Button variant="secondary" onClick={() => { retryLanguages(); retryCards(); }}>Reintentar</Button>
      </div>
    );
  } else if (languages === null || flashcards === null) {
    body = (
      <div className="list" role="status" aria-label="Cargando flashcards">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={64} />)}
      </div>
    );
  } else if (!active) {
    body = (
      <EmptyState
        icon={<Languages className="ic lg" />}
        title="Primero configura un idioma"
        description="Las flashcards pertenecen a un idioma. Crea el primero para empezar."
        actions={<Link className="btn btn-primary" to="/idiomas/nuevo"><Plus className="ic" aria-hidden="true" />Nuevo idioma</Link>}
      />
    );
  } else if (ofLanguage.length === 0) {
    body = (
      <EmptyState
        icon={<Copy className="ic lg" />}
        title={`Todavía no hay flashcards en ${active.name}`}
        description="Crea la primera escribiendo la palabra y los demás campos."
        actions={<Link className="btn btn-primary" to="/flashcards/nueva"><Plus className="ic" aria-hidden="true" />Nueva flashcard</Link>}
      />
    );
  } else {
    body = (
      <>
        <div className="stack" style={{ '--gap': 'var(--sp-3)' } as React.CSSProperties}>
          <div className="toolbar">
            <div className="search">
              <Search className="ic" aria-hidden="true" />
              <input
                className="input"
                type="search"
                placeholder="Buscar por palabra o traducción"
                aria-label="Buscar flashcards"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          </div>
          {active.tags.length > 0 && (
            <div className="chips-scroll" role="group" aria-label="Filtrar por tag">
              <Chip selected={tag === ''} onClick={() => setTag('')}>Todas</Chip>
              {active.tags.map((t) => <Chip key={t} selected={tag === t} onClick={() => setTag(t)}>{t}</Chip>)}
            </div>
          )}
          <p className="small muted" aria-live="polite">{visible.length} {visible.length === 1 ? 'flashcard' : 'flashcards'}</p>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={<Search className="ic lg" />}
            title={q ? `Sin resultados para “${q}”` : 'Sin resultados'}
            description="Prueba con otra palabra, con la traducción o quita los filtros de tag."
            actions={<Button variant="secondary" onClick={clearFilters}>Limpiar búsqueda</Button>}
          />
        ) : (
          <div className="section">
            <div className="row-head" aria-hidden="true">
              <span className="sel-spacer" />
              <span>Palabra</span>
              <span>{secondary ? secondary.name : 'Traducción'}</span>
              <span>{secondary ? 'Traducción' : ''}</span>
              <span>Tags</span>
              <span />
            </div>
            <ul className="list" style={{ listStyle: 'none', padding: 0 }}>
              {shown.map((c) => (
                <li key={c.id}><FlashcardRow card={c} language={active} secondary={secondary} /></li>
              ))}
            </ul>
            {shown.length < visible.length && (
              <div style={{ textAlign: 'center', marginTop: 'var(--sp-4)' }}>
                <Button variant="secondary" onClick={() => setLimit({ key, size: size + PAGE_SIZE })}>
                  Mostrar más ({visible.length - shown.length} restantes)
                </Button>
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="page">
      {header}
      {body}
      {active && (
        <Link className="fab only-mobile" to="/flashcards/nueva" aria-label="Nueva flashcard">
          <Plus className="ic lg" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
