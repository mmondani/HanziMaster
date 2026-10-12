import { db } from '@/lib/firebase';
import { createFirestoreDeckRepository } from './firestore-deck-repository';
import { createFirestoreFlashcardRepository } from './firestore-flashcard-repository';
import { createFirestoreLanguageRepository } from './firestore-language-repository';
import type { Repositories } from './types';

export function createFirestoreRepositories(uid: string): Repositories {
  return {
    languages: createFirestoreLanguageRepository(db, uid),
    flashcards: createFirestoreFlashcardRepository(db, uid),
    decks: createFirestoreDeckRepository(db, uid),
  };
}
