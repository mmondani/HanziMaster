import Papa from 'papaparse';
import { sortFields } from '@/lib/domain/field-rules';
import { buildValues, formFields, isCjk, type FormValues } from '@/lib/domain/flashcard-form';
import { normalizeText } from '@/lib/domain/search';
import { newId } from '@/lib/ids';
import type { FieldDef, FieldValue, Flashcard, Language } from '@/lib/types';

export const MAX_CSV_ROWS = 1000;
export const TAG_SEPARATOR = ';';

/** Marca de orden de bytes que agrega Excel al guardar "CSV UTF-8". */
const BOM = String.fromCharCode(0xfeff);
/** Carácter que aparece al decodificar bytes que no son UTF-8 válido. */
const REPLACEMENT_CHAR = String.fromCharCode(0xfffd);

/** Columnas que espera el CSV: una por campo del idioma, con el nombre del campo como encabezado. */
export interface ExpectedColumn {
  field: FieldDef;
  header: string;
  required: boolean;
  example: string;
}

const WORD_EXAMPLES: Record<string, string> = { zh: '朋友', ja: '友達', ko: '친구' };

function exampleFor(field: FieldDef, language: Language): string {
  if (field.system === 'tags') return `${language.tags[0] ?? 'Tag1'}${TAG_SEPARATOR}${language.tags[1] ?? 'Tag2'}`;
  if (field.type === 'number') return '1';
  if (field.type === 'list') return 'a, b';
  if (field.system === 'word') return WORD_EXAMPLES[language.code.split('-')[0]] ?? 'palabra';
  return isCjk(language) && field.tts ? WORD_EXAMPLES[language.code.split('-')[0]] ?? 'texto' : 'texto';
}

export function expectedColumns(language: Language): ExpectedColumn[] {
  return sortFields(language.fields).map((field) => ({
    field,
    header: field.name,
    required: field.required,
    example: exampleFor(field, language),
  }));
}

/** CSV vacío con solo el encabezado (los nombres de los campos del idioma). */
export function buildTemplate(language: Language): string {
  return Papa.unparse([expectedColumns(language).map((c) => c.header)]).trimEnd() + '\r\n';
}

export type RowStatus = 'ok' | 'invalid' | 'duplicate';

export interface ParsedRow {
  /** Número de fila de datos (el encabezado no cuenta). */
  line: number;
  /** Celdas por encabezado del archivo (para volver a exportar las filas omitidas). */
  cells: Record<string, string>;
  /** Celdas por id de campo del idioma (para mostrar la vista previa). */
  fields: Record<string, string>;
  status: RowStatus;
  /** Motivo por el que se omite ("Falta Traducción"). */
  reason?: string;
  values?: Record<string, FieldValue>;
  tags?: string[];
}

export type CsvAnalysis =
  | { ok: false; error: string }
  | {
      ok: true;
      headers: string[];
      /** Columnas del archivo que no corresponden a ningún campo. */
      ignored: string[];
      rows: ParsedRow[];
      valid: number;
      /** Tags de las filas válidas que todavía no existen en el idioma. */
      newTags: string[];
    };

const wordKey = (value: string) => value.trim().toLowerCase();

function detectDelimiter(headerLine: string): string {
  const counts = [',', ';', '\t'].map((d) => [d, headerLine.split(d).length - 1] as const);
  return counts.reduce((best, c) => (c[1] > best[1] ? c : best))[0];
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * Analiza el contenido de un CSV contra los campos del idioma. El encabezado debe usar los nombres de los
 * campos (sin distinguir mayúsculas ni acentos). Las palabras que ya existen (o se repiten en el archivo)
 * se omiten como duplicadas.
 */
export function analyzeCsv(language: Language, rawText: string, existingWords: string[]): CsvAnalysis {
  const text = rawText.startsWith(BOM) ? rawText.slice(1) : rawText;
  if (text.includes(REPLACEMENT_CHAR)) return { ok: false, error: 'El archivo no está en codificación UTF-8. Guárdalo como "CSV UTF-8" e inténtalo de nuevo.' };
  if (!text.trim()) return { ok: false, error: 'El archivo está vacío.' };

  const firstLine = text.split(/\r?\n/, 1)[0];
  const parsed = Papa.parse<string[]>(text, { delimiter: detectDelimiter(firstLine), skipEmptyLines: 'greedy' });
  const [headerRow, ...dataRows] = parsed.data;
  if (!headerRow || headerRow.every((h) => !h.trim())) return { ok: false, error: 'El archivo no tiene encabezado.' };

  // Encabezado → campo (sin distinguir mayúsculas ni acentos).
  const byHeader = new Map(expectedColumns(language).map((c) => [normalizeText(c.header), c.field]));
  const columns: { index: number; header: string; field: FieldDef }[] = [];
  const ignored: string[] = [];
  headerRow.forEach((h, index) => {
    const field = byHeader.get(normalizeText(h));
    if (field && !columns.some((c) => c.field.id === field.id)) columns.push({ index, header: h.trim(), field });
    else if (h.trim()) ignored.push(h.trim());
  });

  const missing = expectedColumns(language).filter((c) => c.required && c.field.system !== 'tags' && !columns.some((col) => col.field.id === c.field.id));
  if (missing.length > 0) {
    const names = missing.map((m) => `«${m.header}»`).join(', ');
    return { ok: false, error: `${missing.length === 1 ? 'Falta la columna obligatoria' : 'Faltan las columnas obligatorias'} ${names}. Revisa el encabezado o descarga la plantilla.` };
  }
  if (dataRows.length === 0) return { ok: false, error: 'El archivo no tiene filas para importar.' };
  if (dataRows.length > MAX_CSV_ROWS) return { ok: false, error: `El archivo tiene ${dataRows.length} filas y el máximo es ${String(MAX_CSV_ROWS).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}.` };

  const seen = new Set(existingWords.map(wordKey));
  const tagColumn = columns.find((c) => c.field.system === 'tags');
  const knownTags = new Map(language.tags.map((t) => [t.toLowerCase(), t]));
  const newTags: string[] = [];
  const fieldsWithInput = formFields(language);

  const rows: ParsedRow[] = dataRows.map((cells, i) => {
    const line = i + 1;
    const raw: Record<string, string> = {};
    headerRow.forEach((h, index) => { if (h.trim()) raw[h.trim()] = (cells[index] ?? '').trim(); });
    const fieldsRaw: Record<string, string> = {};
    for (const col of columns) fieldsRaw[col.field.id] = (cells[col.index] ?? '').trim();

    // Valores del formulario: la columna presente manda; si falta, rige el valor por defecto del campo.
    const form: FormValues = {};
    for (const f of fieldsWithInput) {
      const col = columns.find((c) => c.field.id === f.id);
      form[f.id] = col ? (cells[col.index] ?? '').trim() : f.defaultValue === undefined ? '' : Array.isArray(f.defaultValue) ? f.defaultValue.join(', ') : String(f.defaultValue);
    }

    for (const f of fieldsWithInput) {
      if (!form[f.id]) {
        if (f.required) return { line, cells: raw, fields: fieldsRaw, status: 'invalid' as const, reason: `Falta ${f.name}` };
      } else if (f.type === 'number' && !Number.isFinite(Number(form[f.id]))) {
        return { line, cells: raw, fields: fieldsRaw, status: 'invalid' as const, reason: `Número inválido en ${f.name}` };
      }
    }

    const word = form.word ?? '';
    if (word && seen.has(wordKey(word))) return { line, cells: raw, fields: fieldsRaw, status: 'duplicate' as const, reason: 'Palabra duplicada' };
    if (word) seen.add(wordKey(word));

    const tags: string[] = [];
    for (const t of (tagColumn ? (cells[tagColumn.index] ?? '') : '').split(TAG_SEPARATOR).map((s) => s.trim()).filter(Boolean)) {
      const known = knownTags.get(t.toLowerCase());
      const name = known ?? t;
      if (!tags.includes(name)) tags.push(name);
      if (!known && !newTags.some((n) => n.toLowerCase() === t.toLowerCase())) newTags.push(t);
    }
    return { line, cells: raw, fields: fieldsRaw, status: 'ok' as const, values: buildValues(language, form), tags };
  });

  // Los tags nuevos solo cuentan los de filas que se van a importar.
  const usedNew = newTags.filter((t) => rows.some((r) => r.status === 'ok' && r.tags?.some((x) => x.toLowerCase() === t.toLowerCase())));
  return { ok: true, headers: headerRow.map((h) => h.trim()), ignored, rows, valid: rows.filter((r) => r.status === 'ok').length, newTags: usedNew };
}

/** Flashcards listas para guardar a partir de las filas válidas. */
export function toFlashcards(language: Language, rows: ParsedRow[], now: number): Flashcard[] {
  return rows
    .filter((r) => r.status === 'ok' && r.values)
    .map((r) => ({ id: newId(), languageId: language.id, values: r.values!, tags: r.tags ?? [], createdAt: now, updatedAt: now }));
}

/** CSV con las filas omitidas (columnas originales + "Motivo"). */
export function buildSkippedCsv(headers: string[], rows: ParsedRow[]): string {
  const skipped = rows.filter((r) => r.status !== 'ok');
  const columns = headers.filter(Boolean);
  const data = skipped.map((r) => [...columns.map((h) => r.cells[h] ?? ''), r.reason ?? '']);
  return Papa.unparse({ fields: [...columns, 'Motivo'], data }) + '\r\n';
}

/** Texto para el aviso de filas omitidas: "fila 5 (falta traducción) y fila 9 (palabra duplicada)". */
export function describeSkipped(rows: ParsedRow[], max = 5): string {
  const skipped = rows.filter((r) => r.status !== 'ok');
  const shown = skipped.slice(0, max).map((r) => `fila ${r.line} (${(r.reason ?? '').toLowerCase()})`);
  const rest = skipped.length - shown.length;
  const head = shown.length > 1 ? `${shown.slice(0, -1).join(', ')} y ${shown.at(-1)}` : shown[0] ?? '';
  return rest > 0 ? `${shown.join(', ')} y ${rest} ${plural(rest, 'más', 'más')}` : head;
}
