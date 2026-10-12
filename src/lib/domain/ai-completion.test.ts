import { chinese } from '@/test/fixtures';
import { applyAiResult, buildAiRequest, NO_AI_APPLIED, sanitizeAiTags } from './ai-completion';

const zh = chinese({ tags: ['Saludos', 'Escuela', 'Comida'] });
const empty = { word: '朋友', pinyin: '', translation: '' };

describe('buildAiRequest', () => {
  it('pide todos los campos salvo la palabra y los tags, con el set de tags del idioma', () => {
    const request = buildAiRequest(zh, ' 朋友 ');
    expect(request.word).toBe('朋友');
    expect(request.languageName).toBe('Chino mandarín');
    expect(request.fields.map((f) => f.id)).toEqual(['pinyin', 'translation']);
    expect(request.tags).toEqual(['Saludos', 'Escuela', 'Comida']);
  });
});

describe('sanitizeAiTags', () => {
  it('descarta tags que no están en el set, repetidos y de tipo inválido, y recorta a 2', () => {
    expect(sanitizeAiTags(zh, ['Inventado', 'saludos', 'Saludos', 7, 'Escuela', 'Comida'])).toEqual(['Saludos', 'Escuela']);
  });
  it('tolera una respuesta que no es lista', () => {
    expect(sanitizeAiTags(zh, 'Saludos')).toEqual([]);
    expect(sanitizeAiTags(zh, undefined)).toEqual([]);
  });
});

describe('applyAiResult', () => {
  it('rellena solo los campos vacíos y no pisa lo que escribió el usuario', () => {
    const r = applyAiResult(zh, { values: { ...empty, translation: 'compañero' }, tags: [] }, {
      values: { pinyin: 'péngyou', translation: 'amigo' },
      tags: ['Saludos'],
    });
    expect(r.values).toMatchObject({ word: '朋友', pinyin: 'péngyou', translation: 'compañero' });
    expect(r.tags).toEqual(['Saludos']);
    expect(r.filledCount).toBe(2);
    expect(r.applied.values).toEqual({ pinyin: 'péngyou' });
  });

  it('nunca toca la palabra, ignora campos desconocidos y valores vacíos o de tipo inválido', () => {
    const r = applyAiResult(zh, { values: empty, tags: [] }, {
      values: { word: '敵', fantasma: 'x', pinyin: '  ', translation: 42 as unknown as string },
      tags: [],
    });
    expect(r.values.word).toBe('朋友');
    expect(r.values.pinyin).toBe('');
    expect(r.values.translation).toBe('42');
    expect(r.values).not.toHaveProperty('fantasma');
  });

  it('no pisa tags ya elegidos por el usuario', () => {
    const r = applyAiResult(zh, { values: empty, tags: ['Escuela'] }, { values: {}, tags: ['Saludos'] });
    expect(r.tags).toEqual(['Escuela']);
    expect(r.filledCount).toBe(0);
  });

  it('valida números y normaliza listas', () => {
    const lang = chinese({
      fields: [
        ...zh.fields,
        { id: 'nivel', name: 'Nivel', type: 'number', tts: false, required: false, order: 9 },
        { id: 'sinonimos', name: 'Sinónimos', type: 'list', tts: false, required: false, order: 10 },
      ],
    });
    const ok = applyAiResult(lang, { values: { ...empty, nivel: '', sinonimos: '' }, tags: [] }, { values: { nivel: ' 2 ', sinonimos: 'a,  b ,,c' }, tags: [] });
    expect(ok.values).toMatchObject({ nivel: '2', sinonimos: 'a, b, c' });
    const bad = applyAiResult(lang, { values: { ...empty, nivel: '', sinonimos: '' }, tags: [] }, { values: { nivel: 'alto' }, tags: [] });
    expect(bad.values.nivel).toBe('');
  });

  it('tolera una respuesta vacía o nula', () => {
    expect(applyAiResult(zh, { values: empty, tags: [] }, null).filledCount).toBe(0);
    expect(applyAiResult(zh, { values: empty, tags: [] }, {}).values).toEqual(empty);
  });

  it('al repetir, reemplaza lo que puso la IA y sigue sin tocar lo que el usuario editó después', () => {
    const first = applyAiResult(zh, { values: empty, tags: [] }, { values: { pinyin: 'péngyou', translation: 'amigo' }, tags: ['Saludos'] });
    const edited = { ...first.values, translation: 'colega' };
    const second = applyAiResult(zh, { values: edited, tags: first.tags }, { values: { pinyin: 'péng you', translation: 'amigo' }, tags: ['Escuela'] }, first.applied);
    expect(second.values).toMatchObject({ pinyin: 'péng you', translation: 'colega' });
    expect(second.tags).toEqual(['Escuela']);
    expect(second.applied.values).toEqual({ pinyin: 'péng you' });
  });

  it('sin historial previo, un valor igual al de la IA no cuenta como suyo', () => {
    const r = applyAiResult(zh, { values: { ...empty, pinyin: 'x' }, tags: [] }, { values: { pinyin: 'y' }, tags: [] }, NO_AI_APPLIED);
    expect(r.values.pinyin).toBe('x');
  });
});
