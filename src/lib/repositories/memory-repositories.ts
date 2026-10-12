import { stripFromFlashcard } from '@/lib/domain/cascades';
import type { Deck, Flashcard, Language } from '@/lib/types';
import type { DeckRepository, FlashcardRepository, LanguageChanges, LanguageRepository, LanguageUsage, Repositories } from './types';

/** Repositorios en memoria para tests. Expone el estado para sembrarlo y verificarlo. */
export class MemoryRepositories implements Repositories {
  languagesData: Language[] = [];
  flashcardsData: Flashcard[] = [];
  decksData: Deck[] = [];
  /** Si se define, `subscribe` falla con este error. */
  languagesError: Error | null = null;
  private listeners = new Set<() => void>();

  languages: LanguageRepository = {
    subscribe: (onData, onError) => {
      const emit = () => {
        if (this.languagesError) onError(this.languagesError);
        else onData([...this.languagesData].sort((a, b) => a.name.localeCompare(b.name)));
      };
      this.listeners.add(emit);
      queueMicrotask(emit);
      return () => { this.listeners.delete(emit); };
    },
    subscribeUsage: (onData) => {
      const emit = () => {
        const usage: Record<string, LanguageUsage> = {};
        for (const l of this.languagesData) {
          usage[l.id] = {
            flashcards: this.flashcardsData.filter((c) => c.languageId === l.id).length,
            decks: this.decksData.filter((d) => d.languageId === l.id).length,
          };
        }
        onData(usage);
      };
      this.listeners.add(emit);
      queueMicrotask(emit);
      return () => { this.listeners.delete(emit); };
    },
    save: async (language: Language, changes?: LanguageChanges) => {
      const i = this.languagesData.findIndex((l) => l.id === language.id);
      if (i >= 0) this.languagesData[i] = language;
      else this.languagesData.push(language);
      if (changes) {
        this.flashcardsData = this.flashcardsData.map((c) => (c.languageId === language.id ? stripFromFlashcard(c, changes.removedFieldIds, changes.removedTags) ?? c : c));
      }
      this.notify();
    },
    remove: async (languageId) => {
      this.languagesData = this.languagesData.filter((l) => l.id !== languageId);
      this.flashcardsData = this.flashcardsData.filter((c) => c.languageId !== languageId);
      this.decksData = this.decksData.filter((d) => d.languageId !== languageId);
      this.notify();
    },
    decksUsingLayout: async (languageId, layoutId) =>
      this.decksData
        .filter((d) => d.languageId === languageId)
        .map((d) => ({ id: d.id, name: d.name, modes: d.modes.filter((m) => m.frontLayoutId === layoutId || m.backLayoutId === layoutId).length }))
        .filter((r) => r.modes > 0),
  };

  flashcards: FlashcardRepository = {
    subscribe: (onData) => {
      const emit = () => onData([...this.flashcardsData]);
      this.listeners.add(emit);
      queueMicrotask(emit);
      return () => { this.listeners.delete(emit); };
    },
    save: async (card) => {
      const i = this.flashcardsData.findIndex((c) => c.id === card.id);
      if (i >= 0) this.flashcardsData[i] = card;
      else this.flashcardsData.push(card);
      this.notify();
    },
    saveMany: async (cards) => {
      for (const card of cards) {
        const i = this.flashcardsData.findIndex((c) => c.id === card.id);
        if (i >= 0) this.flashcardsData[i] = card;
        else this.flashcardsData.push(card);
      }
      this.notify();
    },
    remove: async (cardId) => {
      const card = this.flashcardsData.find((c) => c.id === cardId);
      if (!card) throw new Error('La flashcard no existe');
      const deckIds = this.decksData.filter((d) => d.cardIds.includes(cardId)).map((d) => d.id);
      this.flashcardsData = this.flashcardsData.filter((c) => c.id !== cardId);
      this.decksData = this.decksData.map((d) => (d.cardIds.includes(cardId) ? { ...d, cardIds: d.cardIds.filter((id) => id !== cardId) } : d));
      this.notify();
      return { card, deckIds };
    },
    restore: async ({ card, deckIds }) => {
      this.flashcardsData.push(card);
      this.decksData = this.decksData.map((d) => (deckIds.includes(d.id) ? { ...d, cardIds: [...d.cardIds, card.id] } : d));
      this.notify();
    },
  };

  decks: DeckRepository = {
    subscribe: (onData) => {
      const emit = () => onData([...this.decksData]);
      this.listeners.add(emit);
      queueMicrotask(emit);
      return () => { this.listeners.delete(emit); };
    },
  };

  private notify() {
    this.listeners.forEach((l) => l());
  }
}
