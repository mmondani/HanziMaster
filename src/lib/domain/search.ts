import type { Flashcard, Language } from '@/lib/types';

/** Minúsculas, sin acentos ni espacios sobrantes: "Nǐ Hǎo " → "ni hao". */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function textOf(card: Flashcard, fieldId: string | undefined): string {
  const value = fieldId ? card.values[fieldId] : undefined;
  if (value === undefined) return '';
  return Array.isArray(value) ? value.join(' ') : String(value);
}

export interface FlashcardFilter {
  q?: string;
  tag?: string;
}

/**
 * Flashcards del idioma que coinciden con la búsqueda (contiene, sin distinguir mayúsculas ni acentos,
 * sobre Palabra y Traducción) y con el tag elegido.
 */
export function filterFlashcards(cards: Flashcard[], language: Language, { q, tag }: FlashcardFilter = {}): Flashcard[] {
  const wordId = language.fields.find((f) => f.system === 'word')?.id;
  const translationId = language.fields.find((f) => f.system === 'translation')?.id;
  const needle = normalizeText(q ?? '');
  return cards.filter((c) => {
    if (c.languageId !== language.id) return false;
    if (tag && !c.tags.includes(tag)) return false;
    if (!needle) return true;
    return normalizeText(textOf(c, wordId)).includes(needle) || normalizeText(textOf(c, translationId)).includes(needle);
  });
}
