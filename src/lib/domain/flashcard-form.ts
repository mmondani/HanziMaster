import { sortFields } from '@/lib/domain/field-rules';
import type { FieldDef, FieldValue, Flashcard, Language } from '@/lib/types';

/** Valores del formulario por id de campo, siempre como texto (los tags se manejan aparte). */
export type FormValues = Record<string, string>;
export type FormErrors = Record<string, string>;

/** Campos que se muestran como input (todos menos el de tags del sistema). */
export function formFields(language: Language): FieldDef[] {
  return sortFields(language.fields).filter((f) => f.system !== 'tags');
}

function toText(value: FieldValue | undefined): string {
  if (value === undefined) return '';
  return Array.isArray(value) ? value.join(', ') : String(value);
}

/** Valores iniciales: los de la flashcard en edición o los valores por defecto de cada campo. */
export function toFormValues(language: Language, card?: Flashcard): FormValues {
  const out: FormValues = {};
  for (const f of formFields(language)) out[f.id] = toText(card ? card.values[f.id] : f.defaultValue);
  return out;
}

/** Errores por id de campo: obligatorios vacíos y números con formato inválido. */
export function validateFlashcard(language: Language, values: FormValues): FormErrors {
  const errors: FormErrors = {};
  for (const f of formFields(language)) {
    const text = (values[f.id] ?? '').trim();
    if (!text) {
      if (f.required) errors[f.id] = 'Este campo es obligatorio.';
    } else if (f.type === 'number' && !Number.isFinite(Number(text))) {
      errors[f.id] = 'Ingresa un número válido.';
    }
  }
  return errors;
}

/** Valores tipados listos para guardar (omite los vacíos). */
export function buildValues(language: Language, values: FormValues): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = {};
  for (const f of formFields(language)) {
    const text = (values[f.id] ?? '').trim();
    if (!text) continue;
    if (f.type === 'number') out[f.id] = Number(text);
    else if (f.type === 'list') out[f.id] = text.split(',').map((s) => s.trim()).filter(Boolean);
    else out[f.id] = text;
  }
  return out;
}

/** Los idiomas CJK usan la tipografía serif para sus caracteres. */
export function isCjk(language: Pick<Language, 'code'>): boolean {
  return ['zh', 'ja', 'ko'].includes(language.code.split('-')[0]);
}

/** ¿El campo contiene texto en el idioma que se estudia (se muestra con la tipografía y `lang` del idioma)? */
export function isTargetLanguageField(field: FieldDef): boolean {
  return field.type === 'text' && (field.system === 'word' || field.tts);
}
