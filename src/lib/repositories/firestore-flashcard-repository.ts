import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, where, writeBatch, type Firestore } from 'firebase/firestore';
import type { Deck, Flashcard } from '@/lib/types';
import type { FlashcardRepository } from './types';

export function createFirestoreFlashcardRepository(db: Firestore, uid: string): FlashcardRepository {
  const flashcards = collection(db, 'users', uid, 'flashcards');
  const decks = collection(db, 'users', uid, 'decks');

  return {
    subscribe(onData, onError) {
      return onSnapshot(
        flashcards,
        (snap) => onData(snap.docs.map((d) => ({ ...(d.data() as Flashcard), id: d.id }))),
        onError,
      );
    },

    async save(card) {
      await setDoc(doc(flashcards, card.id), card);
    },

    async saveMany(cards) {
      for (let i = 0; i < cards.length; i += 400) {
        const batch = writeBatch(db);
        cards.slice(i, i + 400).forEach((c) => batch.set(doc(flashcards, c.id), c));
        await batch.commit();
      }
    },

    async remove(cardId) {
      const ref = doc(flashcards, cardId);
      const [cardSnap, deckSnap] = await Promise.all([getDoc(ref), getDocs(query(decks, where('cardIds', 'array-contains', cardId)))]);
      if (!cardSnap.exists()) throw new Error('La flashcard no existe');
      const card = { ...(cardSnap.data() as Flashcard), id: cardId };
      const batch = writeBatch(db);
      batch.delete(ref);
      deckSnap.docs.forEach((d) => batch.update(d.ref, { cardIds: arrayRemove(cardId) }));
      await batch.commit();
      return { card, deckIds: deckSnap.docs.map((d) => d.id) };
    },

    async removeMany(cardIds) {
      if (cardIds.length === 0) return;
      const gone = new Set(cardIds);
      const deckSnap = await getDocs(decks);
      const writes: ((batch: ReturnType<typeof writeBatch>) => void)[] = cardIds.map((id) => (b) => b.delete(doc(flashcards, id)));
      for (const d of deckSnap.docs) {
        const ids = (d.data() as Deck).cardIds.filter((id) => gone.has(id));
        if (ids.length > 0) writes.push((b) => b.update(d.ref, { cardIds: arrayRemove(...ids) }));
      }
      for (let i = 0; i < writes.length; i += 400) {
        const batch = writeBatch(db);
        writes.slice(i, i + 400).forEach((w) => w(batch));
        await batch.commit();
      }
    },

    async restore({ card, deckIds }) {
      const batch = writeBatch(db);
      batch.set(doc(flashcards, card.id), card);
      deckIds.forEach((id) => batch.update(doc(decks, id), { cardIds: arrayUnion(card.id) }));
      await batch.commit();
    },
  };
}
