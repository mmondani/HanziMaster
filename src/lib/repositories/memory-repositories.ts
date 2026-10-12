import { stripFromFlashcard } from '@/lib/domain/cascades';
import type { Deck, Flashcard, Language } from '@/lib/types';
import type { LanguageChanges, LanguageRepository, LanguageUsage, Repositories } from './types';

/** Repositorios en memoria para tests. Expone el estado para sembrarlo y verificarlo. */
export class MemoryRepositories implements Repositories {
  languagesData: Language[] = [];
  flashcards: Flashcard[] = [];
  decks: Deck[] = [];
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
            flashcards: this.flashcards.filter((c) => c.languageId === l.id).length,
            decks: this.decks.filter((d) => d.languageId === l.id).length,
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
        this.flashcards = this.flashcards.map((c) => (c.languageId === language.id ? stripFromFlashcard(c, changes.removedFieldIds, changes.removedTags) ?? c : c));
      }
      this.notify();
    },
    remove: async (languageId) => {
      this.languagesData = this.languagesData.filter((l) => l.id !== languageId);
      this.flashcards = this.flashcards.filter((c) => c.languageId !== languageId);
      this.decks = this.decks.filter((d) => d.languageId !== languageId);
      this.notify();
    },
    decksUsingLayout: async (languageId, layoutId) =>
      this.decks
        .filter((d) => d.languageId === languageId)
        .map((d) => ({ id: d.id, name: d.name, modes: d.modes.filter((m) => m.frontLayoutId === layoutId || m.backLayoutId === layoutId).length }))
        .filter((r) => r.modes > 0),
  };

  private notify() {
    this.listeners.forEach((l) => l());
  }
}
