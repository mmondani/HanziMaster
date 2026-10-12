import { isCjk } from '@/lib/domain/flashcard-form';
import type { FieldValue, Flashcard, Language } from '@/lib/types';

const asText = (v: FieldValue | undefined) => (v === undefined ? '' : Array.isArray(v) ? v.join(', ') : String(v));

/** Palabra y traducción de una flashcard, para listas dentro de mazos (con el campo secundario si existe). */
export function CardSummary({ card, language, secondaryId }: { card: Flashcard; language: Language; secondaryId?: string }) {
  const second = secondaryId ? asText(card.values[secondaryId]) : '';
  return (
    <>
      <span className={`lead${isCjk(language) ? ' han' : ''}`} lang={language.code} style={{ fontSize: 24, minWidth: 56 }}>
        {asText(card.values.word)}
      </span>
      <span className="meta">
        <span className="t">{second || asText(card.values.translation)}</span>
        <span className="s">{second ? asText(card.values.translation) : ''}</span>
      </span>
    </>
  );
}
