import { useDecks } from '@/lib/decks/decks-provider';
import { useFlashcards } from '@/lib/flashcards/flashcards-provider';
import { useLanguages } from '@/lib/languages/languages-provider';
import type { Deck, Flashcard, Language } from '@/lib/types';

export type DeckRecord =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'notfound' }
  | { status: 'nolanguage' }
  | {
      status: 'ready';
      language: Language;
      /** Flashcards del idioma del mazo. */
      flashcards: Flashcard[];
      /** Ausente cuando se está creando un mazo. */
      deck?: Deck;
    };

/** Resuelve el mazo (por id) con su idioma y las flashcards de ese idioma. Sin id es un mazo nuevo del idioma activo. */
export function useDeckRecord(id: string | undefined): DeckRecord {
  const { languages, active, error: languagesError, retry: retryLanguages } = useLanguages();
  const { flashcards, error: cardsError, retry: retryCards } = useFlashcards();
  const { decks, error: decksError, retry: retryDecks } = useDecks();

  if (languagesError || cardsError || decksError) {
    return { status: 'error', retry: () => { retryLanguages(); retryCards(); retryDecks(); } };
  }
  if (languages === null || flashcards === null || decks === null) return { status: 'loading' };

  const deck = id ? decks.find((d) => d.id === id) : undefined;
  if (id && !deck) return { status: 'notfound' };
  const language = deck ? languages.find((l) => l.id === deck.languageId) : active ?? undefined;
  if (!language) return id ? { status: 'notfound' } : { status: 'nolanguage' };
  return { status: 'ready', language, deck, flashcards: flashcards.filter((c) => c.languageId === language.id) };
}
