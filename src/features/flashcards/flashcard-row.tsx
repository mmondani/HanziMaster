import { Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { isCjk } from '@/lib/domain/flashcard-form';
import type { FieldDef, FieldValue, Flashcard, Language } from '@/lib/types';

const asText = (v: FieldValue | undefined) => (v === undefined ? '' : Array.isArray(v) ? v.join(', ') : String(v));

export interface FlashcardRowProps {
  card: Flashcard;
  language: Language;
  /** Segunda columna (por defecto, el primer campo opcional de texto). */
  secondary?: FieldDef;
  /** Modo selección (F02): la fila alterna su selección en vez de abrir el detalle. */
  selecting?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}

/** Fila del listado: palabra, campo secundario, traducción y tags. En desktop es una fila de tabla. */
export function FlashcardRow({ card, language, secondary, selecting, selected, onToggle }: FlashcardRowProps) {
  const word = asText(card.values.word);
  const translation = asText(card.values.translation);
  const second = secondary ? asText(card.values[secondary.id]) : '';
  const tags = card.tags.map((t) => <span key={t} className="tag">{t}</span>);
  const content = (
    <>
      <span className="sel-slot" aria-hidden="true"><span className="sel-box"><Check className="ic sm" /></span></span>
      <span className={`lead${isCjk(language) ? ' han' : ''}`} lang={language.code}>{word}</span>
      <span className="meta">
        <span className="t">{secondary ? second : translation}</span>
        <span className="s">{secondary ? translation : ''}</span>
        {card.tags.length > 0 && <span className="tags m-tags">{tags}</span>}
      </span>
      <span className="tags tags-col">{tags}</span>
      <span className="icon-btn" aria-hidden="true"><ChevronRight className="ic" /></span>
    </>
  );

  if (selecting) {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={Boolean(selected)}
        className={`item card-row${selected ? ' selected' : ''}`}
        style={{ width: '100%', textAlign: 'left' }}
        onClick={onToggle}
      >
        {content}
      </button>
    );
  }
  return <Link className="item card-row" to={`/flashcards/${card.id}`}>{content}</Link>;
}
