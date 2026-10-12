import type { Deck, Flashcard, Language } from '@/lib/types';

export type Unsubscribe = () => void;

export interface LanguageUsage {
  flashcards: number;
  decks: number;
}

/** Mazo que usa un layout (en al menos un modo de recorrida). */
export interface DeckRef {
  id: string;
  name: string;
  /** Cantidad de modos del mazo que usan el layout. */
  modes: number;
}

/** Qué se quitó del idioma al guardarlo; se propaga a las flashcards. */
export interface LanguageChanges {
  removedFieldIds: string[];
  removedTags: string[];
}

export interface LanguageRepository {
  subscribe(onData: (languages: Language[]) => void, onError: (error: Error) => void): Unsubscribe;
  /** Cantidad de flashcards y mazos por idioma (para listados y avisos de eliminación). */
  subscribeUsage(onData: (usage: Record<string, LanguageUsage>) => void): Unsubscribe;
  save(language: Language, changes?: LanguageChanges): Promise<void>;
  /** Elimina el idioma junto con sus flashcards y mazos. */
  remove(languageId: string): Promise<void>;
  decksUsingLayout(languageId: string, layoutId: string): Promise<DeckRef[]>;
}

/** Lo necesario para deshacer la eliminación de una flashcard. */
export interface RemovedFlashcard {
  card: Flashcard;
  /** Mazos de los que se la quitó. */
  deckIds: string[];
}

export interface FlashcardRepository {
  /** Todas las flashcards del usuario (el volumen esperado es bajo; se filtra por idioma en el cliente). */
  subscribe(onData: (cards: Flashcard[]) => void, onError: (error: Error) => void): Unsubscribe;
  save(card: Flashcard): Promise<void>;
  /** Guarda varias flashcards de una vez (edición masiva y su deshacer). */
  saveMany(cards: Flashcard[]): Promise<void>;
  /** Elimina la flashcard y la quita de los mazos que la incluyen. */
  remove(cardId: string): Promise<RemovedFlashcard>;
  /** Deshace `remove`: vuelve a crear la flashcard y la reincorpora a sus mazos. */
  restore(removed: RemovedFlashcard): Promise<void>;
}

export interface DeckRepository {
  subscribe(onData: (decks: Deck[]) => void, onError: (error: Error) => void): Unsubscribe;
}

export interface Repositories {
  languages: LanguageRepository;
  flashcards: FlashcardRepository;
  decks: DeckRepository;
}
