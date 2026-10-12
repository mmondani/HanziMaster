import { addField } from '@/lib/domain/field-rules';
import { card, chinese } from '@/test/fixtures';
import { buildValues, formFields, toFormValues, validateFlashcard } from './flashcard-form';

const base = chinese();
const language = {
  ...base,
  fields: addField(
    addField(base.fields, { id: 'nivel', name: 'Nivel', type: 'number', tts: false, required: false, order: 9, defaultValue: 1 }),
    { id: 'sinonimos', name: 'Sinónimos', type: 'list', tts: false, required: false, order: 9 },
  ),
};

describe('formFields / toFormValues (F03-1)', () => {
  it('un input por campo configurado, en orden, sin el campo de tags', () => {
    expect(formFields(language).map((f) => f.id)).toEqual(['word', 'pinyin', 'translation', 'nivel', 'sinonimos']);
  });
  it('en una flashcard nueva usa los valores por defecto', () => {
    expect(toFormValues(language)).toEqual({ word: '', pinyin: '', translation: '', nivel: '1', sinonimos: '' });
  });
  it('en edición precarga los valores de la flashcard', () => {
    const c = card('1', 'zh', { values: { word: '你好', translation: 'hola', sinonimos: ['a', 'b'], nivel: 3 } });
    expect(toFormValues(language, c)).toMatchObject({ word: '你好', translation: 'hola', sinonimos: 'a, b', nivel: '3', pinyin: '' });
  });
});

describe('validateFlashcard (F03-2)', () => {
  it('Palabra y Traducción son obligatorias', () => {
    const errors = validateFlashcard(language, toFormValues(language));
    expect(Object.keys(errors).sort()).toEqual(['translation', 'word']);
  });
  it('un texto de espacios cuenta como vacío', () => {
    expect(validateFlashcard(language, { ...toFormValues(language), word: '   ', translation: 'x' }).word).toBeDefined();
  });
  it('valida el formato de los números', () => {
    const values = { ...toFormValues(language), word: 'a', translation: 'b', nivel: 'abc' };
    expect(validateFlashcard(language, values)).toEqual({ nivel: 'Ingresa un número válido.' });
    expect(validateFlashcard(language, { ...values, nivel: '2.5' })).toEqual({});
  });
  it('un campo opcional vacío es válido', () => {
    expect(validateFlashcard(language, { ...toFormValues(language), word: 'a', translation: 'b', nivel: '' })).toEqual({});
  });
});

describe('buildValues', () => {
  it('tipa los valores y omite los vacíos', () => {
    const values = { word: ' 朋友 ', pinyin: '', translation: 'amigo', nivel: '2', sinonimos: 'a, b ,, c' };
    expect(buildValues(language, values)).toEqual({ word: '朋友', translation: 'amigo', nivel: 2, sinonimos: ['a', 'b', 'c'] });
  });
});
