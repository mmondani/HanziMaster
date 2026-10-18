import { newId } from '@/lib/ids';
import type { Deck, Language, TraversalMode } from '@/lib/types';
import { DRAW_LAYOUT_ID, DRAW_LAYOUT_NAME, layoutOptions, supportsHandwriting } from './handwriting';

/**
 * Estado de un mazo respecto de sus layouts y flashcards.
 * - `broken`: algún modo usa un layout que ya no existe (se eliminó); el mazo no se puede usar hasta repararlo.
 * - `empty`: no tiene flashcards.
 */
export type DeckStatus =
  | { kind: 'ok' }
  | { kind: 'empty' }
  | { kind: 'broken'; modes: TraversalMode[] };

/** El layout existe: es del idioma o es Dibujar en un idioma que lo ofrece. */
const hasLayout = (language: Language, id: string) => layoutOptions(language).some((l) => l.id === id);

/**
 * Modos que trae un mazo nuevo: copias (con id nuevo) de los modos por defecto del idioma.
 * Se omiten los que usan un layout eliminado; el mazo puede editarlos o quitarlos sin afectar al idioma.
 */
export function modesFromDefaults(language: Language): TraversalMode[] {
  return (language.defaultModes ?? []).filter((m) => !isModeBroken(m, language)).map((m) => ({ ...m, id: newId() }));
}

/** Un modo es válido si sus dos layouts siguen existiendo en el idioma. */
export function isModeBroken(mode: TraversalMode, language: Language): boolean {
  return !hasLayout(language, mode.frontLayoutId) || !hasLayout(language, mode.backLayoutId);
}

/** Estado derivado (no se guarda): se recalcula con el idioma actual. `language` puede faltar si se eliminó. */
export function getDeckStatus(deck: Deck, language: Language | undefined): DeckStatus {
  const broken = language ? deck.modes.filter((m) => isModeBroken(m, language)) : deck.modes;
  if (broken.length > 0) return { kind: 'broken', modes: broken };
  if (deck.cardIds.length === 0) return { kind: 'empty' };
  return { kind: 'ok' };
}

export const canStudy = (status: DeckStatus) => status.kind === 'ok';

function layoutName(language: Language, id: string): string {
  if (id === DRAW_LAYOUT_ID && !supportsHandwriting(language)) return `${DRAW_LAYOUT_NAME} (solo chino o japonés)`;
  return layoutOptions(language).find((l) => l.id === id)?.name ?? 'layout eliminado';
}

/** "Frente: Palabra y pinyin · Reverso: Dibujar" (con "layout eliminado" si ya no existe). */
export function describeMode(mode: TraversalMode, language: Language): string {
  const front = layoutName(language, mode.frontLayoutId);
  const back = layoutName(language, mode.backLayoutId);
  return `Frente: ${front} · Reverso: ${back}`;
}

export interface DeckErrors {
  name?: string;
  cards?: string;
  modes?: string;
  /** Errores por id de modo (layout eliminado, nombre vacío). */
  modeErrors: Record<string, string>;
}

export interface DeckDraft {
  name: string;
  cardIds: string[];
  modes: TraversalMode[];
}

/** Valida un mazo antes de guardarlo: nombre, al menos una flashcard y un modo, y modos sin layouts eliminados. */
export function validateDeck(draft: DeckDraft, language: Language): DeckErrors {
  const errors: DeckErrors = { modeErrors: {} };
  if (!draft.name.trim()) errors.name = 'El nombre es obligatorio.';
  if (draft.cardIds.length === 0) errors.cards = 'El mazo necesita al menos una flashcard.';
  if (draft.modes.length === 0) errors.modes = 'El mazo necesita al menos un modo de recorrida.';
  for (const m of draft.modes) {
    if (!m.name.trim()) errors.modeErrors[m.id] = 'El modo necesita un nombre.';
    else if (isModeBroken(m, language)) errors.modeErrors[m.id] = 'Este modo usa un layout que fue eliminado. Elige otro layout.';
  }
  return errors;
}

export function hasDeckErrors(errors: DeckErrors): boolean {
  return Boolean(errors.name || errors.cards || errors.modes || Object.keys(errors.modeErrors).length > 0);
}
