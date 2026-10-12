import { chinese, deck } from '@/test/fixtures';
import { canStudy, describeMode, getDeckStatus, hasDeckErrors, isModeBroken, validateDeck } from './deck-rules';

const language = chinese();
const mode = { id: 'm1', name: 'Palabra → Significado', frontLayoutId: 'ly1', backLayoutId: 'ly2' };

describe('getDeckStatus (M01-6, M01-7)', () => {
  it('un mazo con flashcards y layouts vigentes está disponible', () => {
    const status = getDeckStatus(deck('d', 'zh', { cardIds: ['a'] }), language);
    expect(status).toEqual({ kind: 'ok' });
    expect(canStudy(status)).toBe(true);
  });
  it('sin flashcards está vacío y no se puede estudiar', () => {
    const status = getDeckStatus(deck('d', 'zh', { cardIds: [] }), language);
    expect(status).toEqual({ kind: 'empty' });
    expect(canStudy(status)).toBe(false);
  });
  it('si un modo usa un layout eliminado (frente o reverso) el mazo no está disponible', () => {
    const front = deck('d', 'zh', { cardIds: ['a'], modes: [{ ...mode, frontLayoutId: 'borrado' }] });
    const back = deck('d', 'zh', { cardIds: ['a'], modes: [{ ...mode, backLayoutId: 'borrado' }] });
    expect(getDeckStatus(front, language)).toMatchObject({ kind: 'broken' });
    expect(getDeckStatus(back, language)).toMatchObject({ kind: 'broken' });
    expect(canStudy(getDeckStatus(front, language))).toBe(false);
  });
  it('lo derivado cambia al eliminar el layout del idioma, sin tocar el mazo', () => {
    const d = deck('d', 'zh', { cardIds: ['a'] });
    const without = { ...language, layouts: language.layouts.filter((l) => l.id !== 'ly1') };
    expect(getDeckStatus(d, language).kind).toBe('ok');
    expect(getDeckStatus(d, without)).toMatchObject({ kind: 'broken', modes: [mode] });
  });
  it('broken tiene prioridad sobre empty y un idioma inexistente deja el mazo roto', () => {
    const d = deck('d', 'zh', { cardIds: [], modes: [{ ...mode, frontLayoutId: 'borrado' }] });
    expect(getDeckStatus(d, language).kind).toBe('broken');
    expect(getDeckStatus(deck('d', 'zh', { cardIds: ['a'] }), undefined).kind).toBe('broken');
  });
  it('un modo sano no está roto', () => {
    expect(isModeBroken(mode, language)).toBe(false);
  });
});

describe('describeMode', () => {
  it('lista el layout de frente y de reverso', () => {
    expect(describeMode(mode, language)).toBe('Frente: Palabra y pinyin · Reverso: Solo traducción');
  });
  it('marca los layouts eliminados', () => {
    expect(describeMode({ ...mode, backLayoutId: 'x' }, language)).toBe('Frente: Palabra y pinyin · Reverso: layout eliminado');
  });
});

describe('validateDeck (M02-6, M02-8)', () => {
  it('exige nombre, al menos una flashcard y un modo', () => {
    const errors = validateDeck({ name: ' ', cardIds: [], modes: [] }, language);
    expect(errors.name).toMatch(/obligatorio/);
    expect(errors.cards).toBe('El mazo necesita al menos una flashcard.');
    expect(errors.modes).toBe('El mazo necesita al menos un modo de recorrida.');
    expect(hasDeckErrors(errors)).toBe(true);
  });
  it('un mazo completo es válido', () => {
    expect(hasDeckErrors(validateDeck({ name: 'Mazo', cardIds: ['a'], modes: [mode] }, language))).toBe(false);
  });
  it('un modo con un layout eliminado se marca con error por modo', () => {
    const errors = validateDeck({ name: 'Mazo', cardIds: ['a'], modes: [{ ...mode, frontLayoutId: 'x' }] }, language);
    expect(errors.modeErrors.m1).toMatch(/layout que fue eliminado/);
    expect(hasDeckErrors(errors)).toBe(true);
  });
  it('un modo sin nombre es inválido', () => {
    expect(validateDeck({ name: 'Mazo', cardIds: ['a'], modes: [{ ...mode, name: '' }] }, language).modeErrors.m1).toMatch(/nombre/);
  });
});
