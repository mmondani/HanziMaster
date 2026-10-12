import {
  collection, doc, getDocs, onSnapshot, query, setDoc, where, writeBatch,
  type DocumentReference, type Firestore,
} from 'firebase/firestore';
import { stripFromFlashcard } from '@/lib/domain/cascades';
import type { Deck, Flashcard, Language } from '@/lib/types';
import type { DeckRef, LanguageChanges, LanguageRepository, LanguageUsage } from './types';

const BATCH_SIZE = 400;

type Write = (batch: ReturnType<typeof writeBatch>) => void;

/** Ejecuta escrituras en lotes (Firestore admite hasta 500 operaciones por lote). */
async function commitInBatches(db: Firestore, writes: Write[]) {
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    writes.slice(i, i + BATCH_SIZE).forEach((w) => w(batch));
    await batch.commit();
  }
}

export function createFirestoreLanguageRepository(db: Firestore, uid: string): LanguageRepository {
  const languages = collection(db, 'users', uid, 'languages');
  const flashcards = collection(db, 'users', uid, 'flashcards');
  const decks = collection(db, 'users', uid, 'decks');

  const cardsOf = (languageId: string) => query(flashcards, where('languageId', '==', languageId));
  const decksOf = (languageId: string) => query(decks, where('languageId', '==', languageId));

  return {
    subscribe(onData, onError) {
      return onSnapshot(
        languages,
        (snap) => {
          const list = snap.docs.map((d) => ({ ...(d.data() as Language), id: d.id }));
          onData(list.sort((a, b) => a.name.localeCompare(b.name)));
        },
        onError,
      );
    },

    subscribeUsage(onData) {
      let cards: Record<string, number> = {};
      let deckCounts: Record<string, number> = {};
      const emit = () => {
        const usage: Record<string, LanguageUsage> = {};
        for (const id of new Set([...Object.keys(cards), ...Object.keys(deckCounts)])) {
          usage[id] = { flashcards: cards[id] ?? 0, decks: deckCounts[id] ?? 0 };
        }
        onData(usage);
      };
      const count = (docs: { data(): unknown }[]) => {
        const out: Record<string, number> = {};
        for (const d of docs) {
          const id = (d.data() as { languageId: string }).languageId;
          out[id] = (out[id] ?? 0) + 1;
        }
        return out;
      };
      const offCards = onSnapshot(flashcards, (s) => { cards = count(s.docs); emit(); }, () => undefined);
      const offDecks = onSnapshot(decks, (s) => { deckCounts = count(s.docs); emit(); }, () => undefined);
      return () => { offCards(); offDecks(); };
    },

    async save(language, changes?: LanguageChanges) {
      await setDoc(doc(languages, language.id), language);
      if (!changes || (changes.removedFieldIds.length === 0 && changes.removedTags.length === 0)) return;
      const snap = await getDocs(cardsOf(language.id));
      const writes: Write[] = [];
      for (const d of snap.docs) {
        const card = { ...(d.data() as Flashcard), id: d.id };
        const next = stripFromFlashcard(card, changes.removedFieldIds, changes.removedTags);
        if (next) writes.push((b) => b.set(d.ref as DocumentReference, next));
      }
      await commitInBatches(db, writes);
    },

    async remove(languageId) {
      const [cardSnap, deckSnap] = await Promise.all([getDocs(cardsOf(languageId)), getDocs(decksOf(languageId))]);
      const writes: Write[] = [...cardSnap.docs, ...deckSnap.docs].map((d) => (b) => b.delete(d.ref));
      await commitInBatches(db, writes);
      await commitInBatches(db, [(b) => b.delete(doc(languages, languageId))]);
    },

    async decksUsingLayout(languageId, layoutId) {
      const snap = await getDocs(decksOf(languageId));
      const refs: DeckRef[] = [];
      for (const d of snap.docs) {
        const deck = d.data() as Deck;
        const modes = deck.modes.filter((m) => m.frontLayoutId === layoutId || m.backLayoutId === layoutId).length;
        if (modes > 0) refs.push({ id: d.id, name: deck.name, modes });
      }
      return refs;
    },
  };
}
