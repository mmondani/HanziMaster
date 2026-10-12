import { db } from '@/lib/firebase';
import { createFirestoreLanguageRepository } from './firestore-language-repository';
import type { Repositories } from './types';

export function createFirestoreRepositories(uid: string): Repositories {
  return { languages: createFirestoreLanguageRepository(db, uid) };
}
