import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Languages, Layers, Plus, Search } from 'lucide-react';
import { LanguageSelector } from '@/components/layout/language-selector';
import { PageHeader } from '@/components/layout/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { SortSelect } from '@/components/ui/sort-select';
import { useDecks } from '@/lib/decks/decks-provider';
import { getDeckStatus } from '@/lib/domain/deck-rules';
import { orderParam, paginate, parseOrder, parsePage, sortByCreated, type SortOrder } from '@/lib/domain/list-view';
import { normalizeText } from '@/lib/domain/search';
import { useLanguages } from '@/lib/languages/languages-provider';
import { DeckCard } from './deck-card';
import { useStudyLauncher } from './use-study-launcher';

const PAGE_SIZE = 12;

/** M01 · Listado de mazos del idioma activo. */
export function DecksPage() {
  const { languages, active, error: languagesError, retry: retryLanguages } = useLanguages();
  const { decks, error: decksError, retry: retryDecks } = useDecks();
  const [q, setQ] = useState('');
  const [params, setParams] = useSearchParams();
  const order = parseOrder(params.get('orden'));
  const pageParam = parsePage(params.get('pagina'));
  const { start, dialog } = useStudyLauncher(active ?? undefined);

  const ofLanguage = useMemo(() => (decks ?? []).filter((d) => d.languageId === active?.id), [decks, active]);
  const visible = useMemo(() => {
    const needle = normalizeText(q);
    const found = needle ? ofLanguage.filter((d) => normalizeText(d.name).includes(needle)) : ofLanguage;
    return sortByCreated(found, order);
  }, [ofLanguage, q, order]);

  const { items: shown, page, pageCount } = paginate(visible, pageParam, PAGE_SIZE);

  /** Cambia el parámetro de la URL; todo cambio salvo el de página vuelve a la primera. */
  function updateParams(change: (p: URLSearchParams) => void, keepPage = false) {
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      change(p);
      if (!keepPage) p.delete('pagina');
      return p;
    }, { replace: true });
  }

  function setOrder(next: SortOrder) {
    const value = orderParam(next);
    updateParams((p) => { if (value) p.set('orden', value); else p.delete('orden'); });
  }

  function goToPage(next: number) {
    updateParams((p) => { if (next > 1) p.set('pagina', String(next)); else p.delete('pagina'); }, true);
    document.querySelector('.page')?.scrollIntoView?.({ block: 'start' });
  }

  function changeSearch(text: string) {
    setQ(text);
    updateParams(() => {});
  }

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
          <div className="toolbar">
            <div className="search">
              <Search className="ic" aria-hidden="true" />
              <input className="input" type="search" placeholder="Buscar mazo" aria-label="Buscar mazos" value={q} onChange={(e) => changeSearch(e.target.value)} />
            </div>
            <SortSelect value={order} onChange={setOrder} />
          </div>
          <p className="small muted" aria-live="polite">{visible.length} {visible.length === 1 ? 'mazo' : 'mazos'}</p>
        </div>
        {visible.length === 0 ? (
          <EmptyState
            icon={<Search className="ic lg" />}
            title={`Sin resultados para “${q}”`}
            actions={<Button variant="secondary" onClick={() => changeSearch('')}>Limpiar búsqueda</Button>}
          />
        ) : (
          <>
            <ul className="deck-grid section" style={{ listStyle: 'none', padding: 0 }}>
              {shown.map((d) => (
                <li key={d.id}><DeckCard deck={d} status={getDeckStatus(d, active)} onStudy={() => start(d)} /></li>
              ))}
            </ul>
            <Pagination page={page} pageCount={pageCount} onChange={goToPage} />
          </>
        )}
      </>
    );
  }

  return (
    <div className="page">
      <PageHeader title="Mazos" languageSelector={<LanguageSelector onSelect={() => changeSearch('')} />} action={newDeck} />
      {body}
      {active && (
        <Link className="fab only-mobile" to="/mazos/nuevo" aria-label="Nuevo mazo"><Plus className="ic lg" aria-hidden="true" /></Link>
      )}
      {dialog}
    </div>
  );
}
