import { collection, deleteDoc, doc, onSnapshot, setDoc, type Firestore } from 'firebase/firestore';
import type { Deck } from '@/lib/types';
import type { DeckRepository } from './types';

export function createFirestoreDeckRepository(db: Firestore, uid: string): DeckRepository {
  const decks = collection(db, 'users', uid, 'decks');
  return {
    subscribe(onData, onError) {
      return onSnapshot(decks, (snap) => onData(snap.docs.map((d) => ({ ...(d.data() as Deck), id: d.id }))), onError);
    },
    async save(deck) {
      await setDoc(doc(decks, deck.id), deck);
    },
    async remove(deckId) {
      await deleteDoc(doc(decks, deckId));
    },
  };
}
