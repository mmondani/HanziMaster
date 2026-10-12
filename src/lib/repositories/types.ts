import type { Language } from '@/lib/types';

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

export interface Repositories {
  languages: LanguageRepository;
}
