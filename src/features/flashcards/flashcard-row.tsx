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
}

/** Fila del listado: palabra, campo secundario, traducción y tags. En desktop es una fila de tabla. */
export function FlashcardRow({ card, language, secondary }: FlashcardRowProps) {
  const word = asText(card.values.word);
  const translation = asText(card.values.translation);
  const second = secondary ? asText(card.values[secondary.id]) : '';
  const tags = card.tags.map((t) => <span key={t} className="tag">{t}</span>);
  return (
    <Link className="item card-row" to={`/flashcards/${card.id}`}>
      <span className="sel-slot" aria-hidden="true"><span className="sel-box"><Check className="ic sm" /></span></span>
      <span className={`lead${isCjk(language) ? ' han' : ''}`} lang={language.code}>{word}</span>
      <span className="meta">
        <span className="t">{secondary ? second : translation}</span>
        <span className="s">{secondary ? translation : ''}</span>
        {card.tags.length > 0 && <span className="tags m-tags">{tags}</span>}
      </span>
      <span className="tags tags-col">{tags}</span>
      <span className="icon-btn" aria-hidden="true"><ChevronRight className="ic" /></span>
    </Link>
  );
}
