import type { TagRename } from '@/lib/domain/field-rules';
import type { Flashcard } from '@/lib/types';

/**
 * Efecto de editar un idioma sobre sus flashcards: quita los valores de los campos eliminados,
 * renombra los tags (todos a la vez, a partir de los nombres originales) y quita los tags eliminados.
 * Devuelve `null` si la flashcard no cambia.
 */
export function stripFromFlashcard(card: Flashcard, removedFieldIds: string[], removedTags: string[], renamedTags: TagRename[] = []): Flashcard | null {
  const hasRemovedField = removedFieldIds.some((id) => id in card.values);
  const hasRemovedTag = card.tags.some((t) => removedTags.includes(t));
  const hasRenamedTag = card.tags.some((t) => renamedTags.some((r) => r.from === t));
  if (!hasRemovedField && !hasRemovedTag && !hasRenamedTag) return null;
  const values = { ...card.values };
  for (const id of removedFieldIds) delete values[id];
  const renamed = card.tags.map((t) => renamedTags.find((r) => r.from === t)?.to ?? t);
  const tags = renamed.filter((t, i) => renamed.indexOf(t) === i && !removedTags.includes(t));
  return { ...card, values, tags };
}
