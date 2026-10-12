import { formFields, type FormValues } from '@/lib/domain/flashcard-form';
import type { FieldType, Language } from '@/lib/types';

/** Máximo de tags que la IA puede asignar. */
export const MAX_AI_TAGS = 2;

export interface AiFieldSpec {
  id: string;
  name: string;
  description?: string;
  type: FieldType;
}

/** Lo que se le pide a la IA: la palabra y la definición de los campos a completar. */
export interface AiRequest {
  word: string;
  languageName: string;
  /** BCP-47 del idioma que se estudia. */
  languageCode: string;
  wordFieldName: string;
  /** Campos a completar (todos menos la palabra y los tags). */
  fields: AiFieldSpec[];
  /** Set de tags del idioma entre los que puede elegir. */
  tags: string[];
}

/** Respuesta de la IA, **no confiable**: se sanea con `applyAiResult` antes de usarla. */
export interface AiResponse {
  values: Record<string, string>;
  tags: string[];
}

/** Servicio de autocompletado; el real usa Gemini y los tests usan uno simulado. */
export interface AiCompleter {
  complete(request: AiRequest): Promise<AiResponse>;
}

/** Lo que la IA puso en el formulario y sigue sin tocarse: permite "Completar de nuevo" sin pisar lo que editó el usuario. */
export interface AiApplied {
  values: Record<string, string>;
  tags: string[];
}

export const NO_AI_APPLIED: AiApplied = { values: {}, tags: [] };

export function buildAiRequest(language: Language, word: string): AiRequest {
  const wordField = formFields(language).find((f) => f.system === 'word');
  return {
    word: word.trim(),
    languageName: language.name,
    languageCode: language.code,
    wordFieldName: wordField?.name ?? 'Palabra',
    fields: formFields(language)
      .filter((f) => f.system !== 'word')
      .map((f) => ({ id: f.id, name: f.name, description: f.description, type: f.type })),
    tags: language.tags,
  };
}

function cleanValue(type: FieldType, raw: unknown): string {
  if (typeof raw !== 'string' && typeof raw !== 'number') return '';
  const text = String(raw).trim();
  if (!text) return '';
  if (type === 'number') return Number.isFinite(Number(text)) ? String(Number(text)) : '';
  if (type === 'list') return text.split(',').map((s) => s.trim()).filter(Boolean).join(', ');
  return text;
}

/** Tags de la respuesta que existen en el set del idioma (sin distinguir mayúsculas), sin repetir y hasta `MAX_AI_TAGS`. */
export function sanitizeAiTags(language: Language, raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const found = language.tags.find((t) => t.toLowerCase() === item.trim().toLowerCase());
    if (found && !out.includes(found)) out.push(found);
  }
  return out.slice(0, MAX_AI_TAGS);
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export interface AiApplyResult {
  values: FormValues;
  tags: string[];
  applied: AiApplied;
  /** Campos y tags que la IA cambió en esta pasada. */
  filledCount: number;
}

/**
 * Vuelca la respuesta de la IA en el formulario. Solo se completan campos vacíos (o cuyo valor sigue siendo
 * el que puso la IA antes); la palabra nunca se toca y los tags se limitan al set del idioma.
 */
export function applyAiResult(
  language: Language,
  current: { values: FormValues; tags: string[] },
  response: Partial<AiResponse> | null | undefined,
  previous: AiApplied = NO_AI_APPLIED,
): AiApplyResult {
  const rawValues = response?.values && typeof response.values === 'object' ? response.values : {};
  const values = { ...current.values };
  const appliedValues: Record<string, string> = {};
  let filledCount = 0;

  for (const f of formFields(language)) {
    if (f.system === 'word') continue;
    const shown = (values[f.id] ?? '').trim();
    const fromAi = shown !== '' && shown === previous.values[f.id];
    const next = cleanValue(f.type, rawValues[f.id]);
    if (next && (shown === '' || fromAi)) {
      values[f.id] = next;
      appliedValues[f.id] = next;
      if (next !== shown) filledCount += 1;
    } else if (fromAi) {
      appliedValues[f.id] = shown;
    }
  }

  let tags = current.tags;
  let appliedTags = sameSet(current.tags, previous.tags) ? previous.tags : [];
  const aiTags = sanitizeAiTags(language, response?.tags);
  if (aiTags.length > 0 && (current.tags.length === 0 || sameSet(current.tags, previous.tags))) {
    if (!sameSet(aiTags, current.tags)) filledCount += 1;
    tags = aiTags;
    appliedTags = aiTags;
  }

  return { values, tags, applied: { values: appliedValues, tags: appliedTags }, filledCount };
}
