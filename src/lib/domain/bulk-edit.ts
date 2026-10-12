import { sortFields } from '@/lib/domain/field-rules';
import type { FieldDef, FieldValue, Flashcard, Language } from '@/lib/types';

export type TagMode = 'add' | 'remove' | 'replace';

/** Edición de un único campo sobre varias flashcards (decisión D9). */
export type BulkEdit =
  | { kind: 'tags'; mode: TagMode; tags: string[] }
  /** `value` es el texto del input; vacío borra el valor (solo en campos opcionales). */
  | { kind: 'field'; fieldId: string; value: string };

/** Campos que se pueden modificar en masa: todos menos Palabra y Traducción, que identifican a cada flashcard. */
export function bulkEditableFields(language: Language): FieldDef[] {
  return sortFields(language.fields).filter((f) => f.system !== 'word' && f.system !== 'translation');
}

function parseValue(field: FieldDef, text: string): { value?: FieldValue; error?: string } {
  const t = text.trim();
  if (!t) return field.required ? { error: 'Este campo es obligatorio.' } : {};
  if (field.type === 'number') return Number.isFinite(Number(t)) ? { value: Number(t) } : { error: 'Ingresa un número válido.' };
  if (field.type === 'list') return { value: t.split(',').map((s) => s.trim()).filter(Boolean) };
  return { value: t };
}

/** Mensaje de error si la edición no se puede aplicar, o `null`. */
export function validateBulkEdit(language: Language, edit: BulkEdit): string | null {
  if (edit.kind === 'tags') {
    if (edit.mode !== 'replace' && edit.tags.length === 0) return 'Elige al menos un tag.';
    return null;
  }
  const field = language.fields.find((f) => f.id === edit.fieldId);
  return field ? parseValue(field, edit.value).error ?? null : 'El campo ya no existe.';
}

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function sameValue(a: FieldValue | undefined, b: FieldValue | undefined): boolean {
  if (Array.isArray(a) && Array.isArray(b)) return sameList(a, b);
  return a === b;
}

/** Versión editada de cada flashcard que cambia; las que ya cumplen la edición se omiten. */
export function applyBulkEdit(language: Language, cards: Flashcard[], edit: BulkEdit, now: number): Flashcard[] {
  const changed: Flashcard[] = [];
  for (const card of cards) {
    let next: Flashcard | null = null;
    if (edit.kind === 'tags') {
      let tags: string[];
      if (edit.mode === 'add') tags = [...card.tags, ...edit.tags.filter((t) => !card.tags.includes(t))];
      else if (edit.mode === 'remove') tags = card.tags.filter((t) => !edit.tags.includes(t));
      else tags = [...edit.tags];
      if (!sameList(tags, card.tags)) next = { ...card, tags };
    } else {
      const field = language.fields.find((f) => f.id === edit.fieldId);
      if (!field) continue;
      const { value } = parseValue(field, edit.value);
      if (!sameValue(card.values[field.id], value)) {
        const values = { ...card.values };
        if (value === undefined) delete values[field.id]; else values[field.id] = value;
        next = { ...card, values };
      }
    }
    if (next) changed.push({ ...next, updatedAt: now });
  }
  return changed;
}

const list = (items: string[]) => items.map((t) => `«${t}»`).join(', ');

/** Resumen en texto plano del efecto: qué se hará y sobre cuántas flashcards. */
export function describeBulkEdit(language: Language, edit: BulkEdit, selected: number, changing: number): string {
  const all = `${selected === 1 ? 'la flashcard seleccionada' : `las ${selected} flashcards seleccionadas`}`;
  const scope = changing === selected ? all : `${changing} de ${all}`;
  if (changing === 0) return 'Ninguna flashcard cambiaría con esta edición.';
  if (edit.kind === 'tags') {
    if (edit.mode === 'add') return `Se agregará ${list(edit.tags)} a ${scope}.`;
    if (edit.mode === 'remove') return `Se quitará ${list(edit.tags)} de ${scope}.`;
    return edit.tags.length === 0
      ? `Se quitarán todos los tags de ${scope}.`
      : `Los tags de ${scope} pasarán a ser ${list(edit.tags)}.`;
  }
  const field = language.fields.find((f) => f.id === edit.fieldId);
  const name = field?.name ?? 'el campo';
  return edit.value.trim()
    ? `El campo «${name}» de ${scope} pasará a valer «${edit.value.trim()}».`
    : `Se borrará el valor de «${name}» en ${scope}.`;
}
