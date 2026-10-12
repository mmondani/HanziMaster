import { createLanguage } from '@/lib/domain/field-rules';
import type { Deck, Flashcard, Language } from '@/lib/types';

/** Idioma de ejemplo: Palabra, Traducción, Tags + Pinyin (con audio) y dos layouts. */
export function chinese(overrides: Partial<Language> = {}): Language {
  const base = createLanguage('Chino mandarín', 'zh-CN');
  const fields = [
    { ...base.fields[0], tts: true },
    { id: 'pinyin', name: 'Pinyin', description: 'Pronunciación con tonos', type: 'text' as const, tts: false, required: false, order: 1 },
    { ...base.fields[1], order: 2 },
    { ...base.fields[2], order: 3 },
  ];
  return {
    ...base,
    id: 'zh',
    fields,
    tags: ['Saludos', 'Escuela'],
    layouts: [
      {
        id: 'ly1',
        name: 'Palabra y pinyin',
        items: [
          { fieldId: 'word', col: 1, row: 1, colSpan: 6, rowSpan: 4, textSize: 'XL', align: 'center' },
          { fieldId: 'pinyin', col: 1, row: 5, colSpan: 6, rowSpan: 1, textSize: 'M', align: 'center' },
        ],
      },
      { id: 'ly2', name: 'Solo traducción', items: [{ fieldId: 'translation', col: 1, row: 1, colSpan: 6, rowSpan: 4, textSize: 'L', align: 'center' }] },
    ],
    ...overrides,
  };
}

export function card(id: string, languageId: string, overrides: Partial<Flashcard> = {}): Flashcard {
  return { id, languageId, values: { word: '你好', translation: 'hola', pinyin: 'nǐ hǎo' }, tags: ['Saludos'], createdAt: 1, updatedAt: 1, ...overrides };
}

export function deck(id: string, languageId: string, overrides: Partial<Deck> = {}): Deck {
  return {
    id, languageId, name: 'Saludos básicos', cardIds: [], learning: 'free',
    modes: [{ id: 'm1', name: 'Palabra → Significado', frontLayoutId: 'ly1', backLayoutId: 'ly2' }],
    ...overrides,
  };
}
