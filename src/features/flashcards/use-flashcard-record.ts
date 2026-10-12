import { useFlashcards } from '@/lib/flashcards/flashcards-provider';
import { useLanguages } from '@/lib/languages/languages-provider';
import type { Flashcard, Language } from '@/lib/types';

export type FlashcardRecord =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  /** No existe la flashcard pedida. */
  | { status: 'notfound' }
  /** Flashcard nueva pero todavía no hay ningún idioma. */
  | { status: 'nolanguage' }
  | { status: 'ready'; language: Language; card?: Flashcard };

/**
 * Resuelve la flashcard (por id) y su idioma. Sin id es una flashcard nueva y usa el idioma activo.
 * La flashcard puede pertenecer a un idioma distinto del activo.
 */
export function useFlashcardRecord(id: string | undefined): FlashcardRecord {
  const { languages, active, error: languagesError, retry: retryLanguages } = useLanguages();
  const { flashcards, error: cardsError, retry: retryCards } = useFlashcards();

  if (languagesError || cardsError) return { status: 'error', retry: () => { retryLanguages(); retryCards(); } };
  if (languages === null || flashcards === null) return { status: 'loading' };
  if (!id) return active ? { status: 'ready', language: active } : { status: 'nolanguage' };
  const card = flashcards.find((c) => c.id === id);
  const language = card ? languages.find((l) => l.id === card.languageId) : undefined;
  return card && language ? { status: 'ready', language, card } : { status: 'notfound' };
}
