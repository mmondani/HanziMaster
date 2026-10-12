import { card, chinese } from '@/test/fixtures';
import { applyBulkEdit, bulkEditableFields, describeBulkEdit, validateBulkEdit } from './bulk-edit';

const language = chinese();
const cards = [
  card('1', 'zh', { tags: ['Saludos'] }),
  card('2', 'zh', { tags: ['Saludos', 'Escuela'] }),
  card('3', 'zh', { tags: [] }),
];

describe('bulkEditableFields (F06-1)', () => {
  it('ofrece todos los campos salvo Palabra y Traducción', () => {
    expect(bulkEditableFields(language).map((f) => f.id)).toEqual(['pinyin', 'tags']);
  });
});

describe('applyBulkEdit · tags (F06-2)', () => {
  it('agrega sin duplicar y omite las que ya lo tienen', () => {
    const changed = applyBulkEdit(language, cards, { kind: 'tags', mode: 'add', tags: ['Escuela'] }, 99);
    expect(changed.map((c) => c.id)).toEqual(['1', '3']);
    expect(changed[0].tags).toEqual(['Saludos', 'Escuela']);
    expect(changed[0].updatedAt).toBe(99);
  });
  it('quita solo los tags indicados', () => {
    const changed = applyBulkEdit(language, cards, { kind: 'tags', mode: 'remove', tags: ['Saludos'] }, 1);
    expect(changed.map((c) => [c.id, c.tags])).toEqual([['1', []], ['2', ['Escuela']]]);
  });
  it('reemplaza el set completo', () => {
    const changed = applyBulkEdit(language, cards, { kind: 'tags', mode: 'replace', tags: ['Comida'] }, 1);
    expect(changed.map((c) => c.id)).toEqual(['1', '2', '3']);
    expect(changed.every((c) => c.tags.length === 1 && c.tags[0] === 'Comida')).toBe(true);
  });
  it('reemplazar por nada deja las flashcards sin tags', () => {
    const changed = applyBulkEdit(language, cards, { kind: 'tags', mode: 'replace', tags: [] }, 1);
    expect(changed.map((c) => c.id)).toEqual(['1', '2']);
  });
  it('no modifica los originales', () => {
    applyBulkEdit(language, cards, { kind: 'tags', mode: 'add', tags: ['X'] }, 1);
    expect(cards[0].tags).toEqual(['Saludos']);
  });
});

describe('applyBulkEdit · otros campos', () => {
  it('reemplaza el valor del campo', () => {
    const changed = applyBulkEdit(language, cards, { kind: 'field', fieldId: 'pinyin', value: ' xx ' }, 1);
    expect(changed).toHaveLength(3);
    expect(changed[0].values.pinyin).toBe('xx');
  });
  it('omite las que ya tienen ese valor', () => {
    const changed = applyBulkEdit(language, cards, { kind: 'field', fieldId: 'pinyin', value: 'nǐ hǎo' }, 1);
    expect(changed).toEqual([]);
  });
  it('un valor vacío borra el campo opcional', () => {
    const changed = applyBulkEdit(language, cards, { kind: 'field', fieldId: 'pinyin', value: '' }, 1);
    expect('pinyin' in changed[0].values).toBe(false);
  });
});

describe('validateBulkEdit', () => {
  it('pide al menos un tag para agregar o quitar, pero no para reemplazar', () => {
    expect(validateBulkEdit(language, { kind: 'tags', mode: 'add', tags: [] })).toMatch(/al menos un tag/);
    expect(validateBulkEdit(language, { kind: 'tags', mode: 'remove', tags: [] })).toMatch(/al menos un tag/);
    expect(validateBulkEdit(language, { kind: 'tags', mode: 'replace', tags: [] })).toBeNull();
  });
  it('valida campos obligatorios y números', () => {
    expect(validateBulkEdit(language, { kind: 'field', fieldId: 'word', value: '' })).toMatch(/obligatorio/);
    expect(validateBulkEdit(language, { kind: 'field', fieldId: 'pinyin', value: '' })).toBeNull();
  });
});

describe('describeBulkEdit (F06-3)', () => {
  it('indica cuántas se modifican y cómo', () => {
    expect(describeBulkEdit(language, { kind: 'tags', mode: 'add', tags: ['HSK1'] }, 3, 3)).toBe('Se agregará «HSK1» a las 3 flashcards seleccionadas.');
    expect(describeBulkEdit(language, { kind: 'tags', mode: 'add', tags: ['HSK1'] }, 3, 2)).toBe('Se agregará «HSK1» a 2 de las 3 flashcards seleccionadas.');
    expect(describeBulkEdit(language, { kind: 'tags', mode: 'remove', tags: ['A', 'B'] }, 1, 1)).toBe('Se quitará «A», «B» de la flashcard seleccionada.');
    expect(describeBulkEdit(language, { kind: 'tags', mode: 'replace', tags: [] }, 2, 2)).toBe('Se quitarán todos los tags de las 2 flashcards seleccionadas.');
    expect(describeBulkEdit(language, { kind: 'field', fieldId: 'pinyin', value: 'x' }, 2, 2)).toContain('«Pinyin»');
    expect(describeBulkEdit(language, { kind: 'tags', mode: 'add', tags: ['A'] }, 2, 0)).toBe('Ninguna flashcard cambiaría con esta edición.');
  });
});
