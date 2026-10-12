import { chinese, card } from '@/test/fixtures';
import { filterFlashcards, normalizeText } from './search';

const language = chinese();
const cards = [
  card('1', 'zh', { values: { word: '你好', translation: 'hola', pinyin: 'nǐ hǎo' }, tags: ['Saludos', 'HSK1'] }),
  card('2', 'zh', { values: { word: '谢谢', translation: 'Gracias' }, tags: ['Saludos'] }),
  card('3', 'zh', { values: { word: '学生', translation: 'estudiante' }, tags: ['Escuela'] }),
  card('4', 'ja', { values: { word: 'こんにちは', translation: 'hola' }, tags: [] }),
];

describe('normalizeText', () => {
  it('ignora mayúsculas, acentos y espacios sobrantes', () => {
    expect(normalizeText('  Nǐ Hǎo ')).toBe('ni hao');
    expect(normalizeText('ESTUDIANTE')).toBe('estudiante');
    expect(normalizeText('Canción')).toBe('cancion');
  });
});

describe('filterFlashcards (F01-1, F01-2, F01-3)', () => {
  it('solo devuelve flashcards del idioma pedido', () => {
    expect(filterFlashcards(cards, language).map((c) => c.id)).toEqual(['1', '2', '3']);
  });
  it('busca por palabra o traducción, sin distinguir mayúsculas ni acentos', () => {
    expect(filterFlashcards(cards, language, { q: '你' }).map((c) => c.id)).toEqual(['1']);
    expect(filterFlashcards(cards, language, { q: 'GRACIAS' }).map((c) => c.id)).toEqual(['2']);
    expect(filterFlashcards(cards, language, { q: 'estud' }).map((c) => c.id)).toEqual(['3']);
    expect(filterFlashcards(cards, language, { q: 'ola' }).map((c) => c.id)).toEqual(['1']);
  });
  it('no busca en otros campos (pinyin)', () => {
    expect(filterFlashcards(cards, language, { q: 'hao' })).toEqual([]);
  });
  it('filtra por tag y combina con la búsqueda', () => {
    expect(filterFlashcards(cards, language, { tag: 'Saludos' }).map((c) => c.id)).toEqual(['1', '2']);
    expect(filterFlashcards(cards, language, { tag: 'Saludos', q: 'grac' }).map((c) => c.id)).toEqual(['2']);
    expect(filterFlashcards(cards, language, { tag: 'Comida' })).toEqual([]);
  });
  it('una búsqueda vacía o de espacios no filtra', () => {
    expect(filterFlashcards(cards, language, { q: '   ' })).toHaveLength(3);
  });
});
