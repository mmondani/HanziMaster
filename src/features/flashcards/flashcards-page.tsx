import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Copy, Languages, ListChecks, Plus, Search, Upload } from 'lucide-react';
import { LanguageSelector } from '@/components/layout/language-selector';
import { PageHeader } from '@/components/layout/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Menu } from '@/components/ui/menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast-provider';
import { sortFields } from '@/lib/domain/field-rules';
import { filterFlashcards } from '@/lib/domain/search';
import { useFlashcards } from '@/lib/flashcards/flashcards-provider';
import { useLanguages } from '@/lib/languages/languages-provider';
import { useRepositories } from '@/lib/repositories/repositories-provider';
import type { Flashcard } from '@/lib/types';
import { BulkEditDialog } from './bulk-edit-dialog';
import { FlashcardRow } from './flashcard-row';
import { SelectionBar } from './selection-bar';
import { useCreateTag } from './use-create-tag';

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 200;

/** F01 · Listado de flashcards del idioma activo, con búsqueda en vivo, filtro por tag y selección múltiple (F02). */
export function FlashcardsPage() {
  const { languages, active, error: languagesError, retry: retryLanguages } = useLanguages();
  const { flashcards, error: cardsError, retry: retryCards } = useFlashcards();
  const repos = useRepositories();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const tagParam = params.get('tag') ?? '';

  const [text, setText] = useState(q);
  const [limit, setLimit] = useState<{ key: string; size: number }>({ key: '', size: PAGE_SIZE });
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

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

  // Esc sale del modo selección (si no hay un diálogo abierto, que lo captura antes).
  useEffect(() => {
    if (!selecting) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') cancelSelection(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selecting]);

  const tag = active?.tags.includes(tagParam) ? tagParam : '';
  const ofLanguage = useMemo(() => (active && flashcards ? filterFlashcards(flashcards, active) : []), [active, flashcards]);
  const visible = useMemo(() => (active && flashcards ? filterFlashcards(flashcards, active, { q, tag }) : []), [active, flashcards, q, tag]);
  const secondary = active ? sortFields(active.fields).find((f) => !f.system && f.type === 'text') : undefined;

  // La selección solo cuenta las flashcards que están a la vista.
  const selected = useMemo(() => visible.filter((c) => selectedIds.has(c.id)), [visible, selectedIds]);
  const allVisibleSelected = visible.length > 0 && selected.length === visible.length;

  const key = `${active?.id}|${q}|${tag}`;
  const size = limit.key === key ? limit.size : PAGE_SIZE;
  const shown = visible.slice(0, size);

  const createTag = useCreateTag(active ?? { id: '', name: '', code: '', fields: [], tags: [], layouts: [] });

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

  function cancelSelection() {
    setSelecting(false);
    setSelectedIds(new Set());
  }

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((c) => next.delete(c.id));
      else visible.forEach((c) => next.add(c.id));
      return next;
    });
  }

  async function applyBulk(changed: Flashcard[]) {
    const originals = selected.filter((c) => changed.some((x) => x.id === c.id));
    await repos.flashcards.saveMany(changed);
    setBulkOpen(false);
    cancelSelection();
    toast.show({
      message: `Se actualizaron ${changed.length} ${changed.length === 1 ? 'flashcard' : 'flashcards'}`,
      duration: 8000,
      action: { label: 'Deshacer', onClick: () => void repos.flashcards.saveMany(originals) },
    });
  }

  const startSelecting = () => setSelecting(true);

  const header = (
    <PageHeader
      title="Flashcards"
      languageSelector={<LanguageSelector onSelect={() => { clearFilters(); cancelSelection(); }} />}
      desktopActions={
        !selecting && active ? (
          <>
            {ofLanguage.length > 0 && <Button variant="ghost" onClick={startSelecting}><ListChecks className="ic" aria-hidden="true" />Seleccionar</Button>}
            <Link className="btn btn-secondary" to="/flashcards/importar"><Upload className="ic" aria-hidden="true" />Importar CSV</Link>
          </>
        ) : undefined
      }
      action={<Link className="btn btn-primary" to="/flashcards/nueva"><Plus className="ic" aria-hidden="true" />Nueva flashcard</Link>}
      mobileActions={
        !selecting && active ? (
          <Menu
            label="Más acciones"
            items={[
              ...(ofLanguage.length > 0 ? [{ label: 'Seleccionar', icon: <ListChecks className="ic" aria-hidden="true" />, onSelect: startSelecting }] : []),
              { label: 'Importar CSV', icon: <Upload className="ic" aria-hidden="true" />, to: '/flashcards/importar' },
            ]}
          />
        ) : undefined
      }
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
        description="Crea la primera escribiendo la palabra y los demás campos, o importa varias desde un CSV."
        actions={
          <div className="btn-group" style={{ justifyContent: 'center' }}>
            <Link className="btn btn-primary" to="/flashcards/nueva"><Plus className="ic" aria-hidden="true" />Nueva flashcard</Link>
            <Link className="btn btn-secondary" to="/flashcards/importar"><Upload className="ic" aria-hidden="true" />Importar CSV</Link>
          </div>
        }
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
          {selecting && visible.length > 0 && (
            <label className="check">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
              Seleccionar todas las visibles
            </label>
          )}
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={<Search className="ic lg" />}
            title={q ? `Sin resultados para “${q}”` : 'Sin resultados'}
            description="Prueba con otra palabra, con la traducción o quita los filtros de tag."
            actions={<Button variant="secondary" onClick={clearFilters}>Limpiar búsqueda</Button>}
          />
        ) : (
          <div className={`section${selecting ? ' select-mode' : ''}`} style={selecting ? { paddingBottom: 'calc(var(--sp-8, 64px) + 24px)' } : undefined}>
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
                <li key={c.id}>
                  <FlashcardRow card={c} language={active} secondary={secondary} selecting={selecting} selected={selectedIds.has(c.id)} onToggle={() => toggle(c.id)} />
                </li>
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
      {active && !selecting && (
        <Link className="fab only-mobile" to="/flashcards/nueva" aria-label="Nueva flashcard">
          <Plus className="ic lg" aria-hidden="true" />
        </Link>
      )}
      {selecting && (
        <SelectionBar ids={selected.map((c) => c.id)} onEdit={() => setBulkOpen(true)} onCancel={cancelSelection} />
      )}
      {bulkOpen && active && (
        <BulkEditDialog language={active} cards={selected} onApply={applyBulk} onCreateTag={createTag} onClose={() => setBulkOpen(false)} />
      )}
    </div>
  );
}
