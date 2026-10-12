import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Dialog } from '@/components/ui/dialog';
import { sortFields } from '@/lib/domain/field-rules';
import { filterFlashcards } from '@/lib/domain/search';
import type { Flashcard, Language } from '@/lib/types';
import { CardSummary } from './card-summary';

const PAGE_SIZE = 50;

export interface FlashcardPickerDialogProps {
  language: Language;
  /** Flashcards del idioma entre las que elegir. */
  flashcards: Flashcard[];
  /** Ids ya incluidos en el mazo (llegan marcados). */
  selected: string[];
  /** Devuelve los ids elegidos: los que ya estaban conservan su orden y los nuevos van al final. */
  onConfirm: (ids: string[]) => void;
  onClose: () => void;
}

/** Selector de flashcards del mazo, con búsqueda, filtro por tag y selección múltiple. */
export function FlashcardPickerDialog({ language, flashcards, selected, onConfirm, onClose }: FlashcardPickerDialogProps) {
  const [chosen, setChosen] = useState(() => new Set(selected));
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [size, setSize] = useState(PAGE_SIZE);

  const visible = useMemo(() => filterFlashcards(flashcards, language, { q, tag }), [flashcards, language, q, tag]);
  const allVisible = visible.length > 0 && visible.every((c) => chosen.has(c.id));
  const secondaryId = sortFields(language.fields).find((f) => !f.system && f.type === 'text')?.id;

  function toggle(id: string) {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleVisible() {
    setChosen((prev) => {
      const next = new Set(prev);
      visible.forEach((c) => (allVisible ? next.delete(c.id) : next.add(c.id)));
      return next;
    });
  }

  function confirm() {
    const kept = selected.filter((id) => chosen.has(id));
    const added = flashcards.filter((c) => chosen.has(c.id) && !selected.includes(c.id)).map((c) => c.id);
    onConfirm([...kept, ...added]);
  }

  return (
    <Dialog
      open
      title="Agregar flashcards"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirm}>Listo · {chosen.size} {chosen.size === 1 ? 'seleccionada' : 'seleccionadas'}</Button>
        </>
      }
    >
      <div className="stack" style={{ '--gap': 'var(--sp-3)' } as React.CSSProperties}>
        <div className="search">
          <Search className="ic" aria-hidden="true" />
          <input
            className="input"
            type="search"
            data-autofocus
            placeholder="Buscar por palabra o traducción"
            aria-label="Buscar flashcards"
            value={q}
            onChange={(e) => { setQ(e.target.value); setSize(PAGE_SIZE); }}
          />
        </div>
        {language.tags.length > 0 && (
          <div className="chips-scroll" role="group" aria-label="Filtrar por tag">
            <Chip selected={tag === ''} onClick={() => { setTag(''); setSize(PAGE_SIZE); }}>Todas</Chip>
            {language.tags.map((t) => <Chip key={t} selected={tag === t} onClick={() => { setTag(t); setSize(PAGE_SIZE); }}>{t}</Chip>)}
          </div>
        )}
        <div className="row small">
          <Button variant="ghost" style={{ minHeight: 40 }} disabled={visible.length === 0} onClick={toggleVisible}>
            {allVisible ? 'Quitar todas las visibles' : 'Seleccionar todas las visibles'}
          </Button>
        </div>
        {visible.length === 0 ? (
          <p className="muted" role="status">{flashcards.length === 0 ? 'Este idioma todavía no tiene flashcards.' : 'Sin resultados.'}</p>
        ) : (
          <ul className="list" style={{ listStyle: 'none', padding: 0 }}>
            {visible.slice(0, size).map((c) => (
              <li key={c.id}>
                <label className="item hover" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={chosen.has(c.id)}
                    onChange={() => toggle(c.id)}
                    aria-label={String(c.values.word ?? c.id)}
                    style={{ width: 22, height: 22, accentColor: 'var(--primary)' }}
                  />
                  <CardSummary card={c} language={language} secondaryId={secondaryId} />
                </label>
              </li>
            ))}
          </ul>
        )}
        {visible.length > size && (
          <Button variant="secondary" onClick={() => setSize((n) => n + PAGE_SIZE)}>Mostrar más ({visible.length - size} restantes)</Button>
        )}
      </div>
    </Dialog>
  );
}
