import { newId } from '@/lib/ids';
import type { FieldDef, Language, Layout } from '@/lib/types';

/** Los tres campos base de todo idioma. Sus ids son estables para que los layouts puedan referenciarlos. */
export function createSystemFields(): FieldDef[] {
  return [
    { id: 'word', name: 'Palabra', description: 'La palabra que estás estudiando', type: 'text', tts: false, required: true, system: 'word', order: 0 },
    { id: 'translation', name: 'Traducción', description: 'Su significado', type: 'text', tts: false, required: true, system: 'translation', order: 1 },
    { id: 'tags', name: 'Tags', description: 'Clasifican y filtran las flashcards', type: 'list', tts: false, required: false, system: 'tags', order: 2 },
  ];
}

export function createLanguage(name: string, code: string): Language {
  return { id: newId(), name: name.trim(), code, fields: createSystemFields(), tags: [], layouts: [] };
}

export function isSystemField(field: FieldDef): boolean {
  return field.system !== undefined;
}

export function sortFields(fields: FieldDef[]): FieldDef[] {
  return [...fields].sort((a, b) => a.order - b.order);
}

function renumber(fields: FieldDef[]): FieldDef[] {
  return fields.map((f, i) => (f.order === i ? f : { ...f, order: i }));
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Mensaje de error si el nombre no es válido (vacío o repetido dentro del idioma), o `null`. */
export function validateFieldName(name: string, fields: FieldDef[], currentId?: string): string | null {
  if (!name.trim()) return 'El nombre es obligatorio.';
  if (fields.some((f) => f.id !== currentId && sameName(f.name, name))) return 'Ya existe un campo con ese nombre.';
  return null;
}

/** Campos normalizados: los de sistema conservan tipo y obligatoriedad. */
export function normalizeField(field: FieldDef, previous?: FieldDef): FieldDef {
  let next = { ...field, name: field.name.trim() };
  if (previous?.system) next = { ...next, id: previous.id, system: previous.system, type: previous.type };
  if (next.system === 'word' || next.system === 'translation') next.required = true;
  if (next.type !== 'text') next.tts = false;
  return next;
}

export function addField(fields: FieldDef[], field: FieldDef): FieldDef[] {
  return renumber([...sortFields(fields), { ...normalizeField(field), order: fields.length }]);
}

export function updateField(fields: FieldDef[], field: FieldDef): FieldDef[] {
  return renumber(sortFields(fields).map((f) => (f.id === field.id ? { ...normalizeField(field, f), order: f.order } : f)));
}

/** No se pueden eliminar los campos de sistema. */
export function removeField(fields: FieldDef[], id: string): FieldDef[] {
  const target = fields.find((f) => f.id === id);
  if (target && isSystemField(target)) throw new Error('Los campos de sistema no se pueden eliminar');
  return renumber(sortFields(fields).filter((f) => f.id !== id));
}

export function moveField(fields: FieldDef[], id: string, direction: -1 | 1): FieldDef[] {
  const list = sortFields(fields);
  const i = list.findIndex((f) => f.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return renumber(list);
  [list[i], list[j]] = [list[j], list[i]];
  return renumber(list);
}

/** Un idioma siempre conserva sus tres campos de sistema (palabra, traducción y tags). */
export function hasSystemFields(fields: FieldDef[]): boolean {
  const kinds = new Set(fields.filter((f) => f.system).map((f) => f.system));
  return fields.length >= 3 && kinds.has('word') && kinds.has('translation') && kinds.has('tags');
}

export function layoutsUsingField(layouts: Layout[], fieldId: string): Layout[] {
  return layouts.filter((l) => l.items.some((i) => i.fieldId === fieldId));
}

export function removeFieldFromLayouts(layouts: Layout[], fieldId: string): Layout[] {
  return layouts.map((l) => ({ ...l, items: l.items.filter((i) => i.fieldId !== fieldId) }));
}

export interface TagResult {
  tags: string[];
  /** Mensaje cuando el tag no se agregó. */
  error?: string;
}

/** Agrega un tag sin duplicados (sin distinguir mayúsculas). */
export function addTag(tags: string[], raw: string): TagResult {
  const tag = raw.trim();
  if (!tag) return { tags };
  if (tags.some((t) => sameName(t, tag))) return { tags, error: `El tag «${tag}» ya existe.` };
  return { tags: [...tags, tag] };
}

export function removeTag(tags: string[], tag: string): string[] {
  return tags.filter((t) => t !== tag);
}

/**
 * Renombra un tag conservando su posición. Un nombre vacío o que ya usa otro tag (sin distinguir
 * mayúsculas) es un error; cambiar solo mayúsculas o espacios del propio tag es válido.
 */
export function renameTag(tags: string[], from: string, raw: string): TagResult {
  const to = raw.trim();
  if (!to) return { tags, error: 'El nombre del tag no puede estar vacío.' };
  if (tags.some((t) => t !== from && sameName(t, to))) return { tags, error: `El tag «${to}» ya existe.` };
  return { tags: tags.map((t) => (t === from ? to : t)) };
}

/** Un tag del set original que ahora se llama distinto; se propaga a las flashcards al guardar. */
export interface TagRename {
  from: string;
  to: string;
}

/** Registra que el tag `current` pasó a llamarse `to`, encadenando renombrados sucesivos desde el nombre original. */
export function trackRename(renames: TagRename[], current: string, to: string): TagRename[] {
  const origin = renames.find((r) => r.to === current)?.from ?? current;
  const rest = renames.filter((r) => r.to !== current);
  return origin === to ? rest : [...rest, { from: origin, to }];
}

/** Olvida el renombrado de un tag que se quitó: su nombre original pasa a contar como quitado. */
export function untrackRename(renames: TagRename[], tag: string): TagRename[] {
  return renames.filter((r) => r.to !== tag);
}

/** Renombrados que siguen vigentes al guardar: el original existía y el nuevo sigue en el idioma. */
export function effectiveRenames(renames: TagRename[], originalTags: string[], tags: string[]): TagRename[] {
  return renames.filter((r) => r.from !== r.to && originalTags.includes(r.from) && tags.includes(r.to));
}

/** Mensaje de error del nombre del idioma (obligatorio y único), o `null`. */
export function validateLanguageName(name: string, languages: Language[], currentId?: string): string | null {
  if (!name.trim()) return 'El nombre es obligatorio.';
  if (languages.some((l) => l.id !== currentId && sameName(l.name, name))) return 'Ya existe un idioma con ese nombre.';
  return null;
}
