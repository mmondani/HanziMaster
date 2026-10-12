import type { Language } from '@/lib/types';
import type { LanguageUsage } from '@/lib/repositories/types';

export interface LanguageCode {
  code: string;
  label: string;
}

/** Códigos BCP-47 sugeridos (se usan para text-to-speech y el atributo `lang`). */
export const LANGUAGE_CODES: LanguageCode[] = [
  { code: 'zh-CN', label: 'Chino (simplificado)' },
  { code: 'zh-TW', label: 'Chino (tradicional)' },
  { code: 'ja-JP', label: 'Japonés' },
  { code: 'ko-KR', label: 'Coreano' },
  { code: 'en-US', label: 'Inglés (EE. UU.)' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Francés' },
  { code: 'de-DE', label: 'Alemán' },
  { code: 'it-IT', label: 'Italiano' },
  { code: 'pt-BR', label: 'Portugués (Brasil)' },
  { code: 'ru-RU', label: 'Ruso' },
];

const GLYPHS: Record<string, string> = { zh: '中', ja: '日', ko: '한' };

/** Carácter distintivo del idioma para su ícono: 中, 日, 한… o la inicial del nombre. */
export function languageGlyph(language: Pick<Language, 'name' | 'code'>): string {
  return GLYPHS[language.code.split('-')[0]] ?? (language.name.trim().charAt(0).toUpperCase() || '?');
}

/** Resumen del listado: "5 campos · 7 tags · 3 layouts · 38 flashcards". */
export function languageSummary(language: Language, usage?: LanguageUsage): string {
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  return [
    plural(language.fields.length, 'campo', 'campos'),
    plural(language.tags.length, 'tag', 'tags'),
    plural(language.layouts.length, 'layout', 'layouts'),
    plural(usage?.flashcards ?? 0, 'flashcard', 'flashcards'),
  ].join(' · ');
}
