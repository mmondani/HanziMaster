import type { Flashcard } from '@/lib/types';

/**
 * Efecto de editar un idioma sobre sus flashcards: quita los valores de los campos eliminados
 * y los tags quitados. Devuelve `null` si la flashcard no cambia.
 */
export function stripFromFlashcard(card: Flashcard, removedFieldIds: string[], removedTags: string[]): Flashcard | null {
  const hasRemovedField = removedFieldIds.some((id) => id in card.values);
  const hasRemovedTag = card.tags.some((t) => removedTags.includes(t));
  if (!hasRemovedField && !hasRemovedTag) return null;
  const values = { ...card.values };
  for (const id of removedFieldIds) delete values[id];
  return { ...card, values, tags: card.tags.filter((t) => !removedTags.includes(t)) };
}
