import { reshuffle, shuffle } from './shuffle';
import { initStudy, studyReducer } from './study-session';

describe('shuffle (R01-1)', () => {
  const items = Array.from({ length: 20 }, (_, i) => i);

  it('devuelve una permutación sin repetidos ni faltantes y no modifica el original', () => {
    const out = shuffle(items);
    expect([...out].sort((a, b) => a - b)).toEqual(items);
    expect(items).toEqual(Array.from({ length: 20 }, (_, i) => i));
  });
  it('es determinista con un generador fijo', () => {
    const seq = (values: number[]) => { let i = 0; return () => values[i++ % values.length]; };
    expect(shuffle([1, 2, 3, 4], seq([0, 0, 0]))).toEqual([2, 3, 4, 1]);
    expect(shuffle([1, 2, 3, 4], () => 0.999999)).toEqual([1, 2, 3, 4]);
  });
  it('realmente mezcla (no devuelve siempre el mismo orden)', () => {
    const orders = new Set(Array.from({ length: 20 }, () => shuffle([1, 2, 3, 4, 5]).join()));
    expect(orders.size).toBeGreaterThan(1);
  });
  it('maneja listas vacías y de un elemento', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(['a'])).toEqual(['a']);
  });
});

describe('reshuffle (R03-2)', () => {
  it('nunca devuelve el mismo orden cuando hay más de una carta', () => {
    const identity = () => 0.999999;
    const previous = [1, 2, 3, 4];
    for (let i = 0; i < 50; i++) expect(reshuffle(previous, previous, i % 2 ? Math.random : identity)).not.toEqual(previous);
  });
  it('conserva los mismos elementos', () => {
    expect([...reshuffle([1, 2, 3], [1, 2, 3])].sort()).toEqual([1, 2, 3]);
  });
  it('con una sola carta devuelve esa carta', () => {
    expect(reshuffle(['a'], ['a'])).toEqual(['a']);
  });
});

describe('studyReducer', () => {
  const start = () => initStudy(['a', 'b', 'c']);

  it('arranca en la primera carta, por el frente (R01-1)', () => {
    expect(start()).toEqual({ order: ['a', 'b', 'c'], index: 0, flipped: false, finished: false });
  });
  it('flip alterna la cara (R01-2)', () => {
    const flipped = studyReducer(start(), { type: 'flip' });
    expect(flipped.flipped).toBe(true);
    expect(studyReducer(flipped, { type: 'flip' }).flipped).toBe(false);
  });
  it('next avanza y muestra la carta nueva por el frente (R01-5)', () => {
    const s = studyReducer(studyReducer(start(), { type: 'flip' }), { type: 'next' });
    expect(s).toMatchObject({ index: 1, flipped: false, finished: false });
  });
  it('prev retrocede y no pasa de la primera', () => {
    const second = studyReducer(start(), { type: 'next' });
    expect(studyReducer(second, { type: 'prev' }).index).toBe(0);
    expect(studyReducer(start(), { type: 'prev' })).toEqual(start());
  });
  it('next desde la última carta termina el mazo (R03-1)', () => {
    let s = start();
    s = studyReducer(studyReducer(s, { type: 'next' }), { type: 'next' });
    expect(s.index).toBe(2);
    s = studyReducer(s, { type: 'next' });
    expect(s).toMatchObject({ index: 2, finished: true });
  });
  it('un mazo de una carta termina al avanzar', () => {
    expect(studyReducer(initStudy(['a']), { type: 'next' }).finished).toBe(true);
  });
  it('terminado ignora flip/next/prev y restart reinicia con el nuevo orden (R03-2)', () => {
    const done = studyReducer(initStudy(['a']), { type: 'next' });
    expect(studyReducer(done, { type: 'flip' })).toBe(done);
    expect(studyReducer(done, { type: 'prev' })).toBe(done);
    expect(studyReducer(done, { type: 'restart', order: ['x', 'y'] })).toEqual(initStudy(['x', 'y']));
  });
});
