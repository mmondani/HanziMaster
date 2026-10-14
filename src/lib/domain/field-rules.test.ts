import type { FieldDef, Layout } from '@/lib/types';
import {
  addField, addTag, effectiveRenames, renameTag, trackRename, untrackRename, createLanguage, createSystemFields, hasSystemFields, layoutsUsingField, moveField,
  removeField, removeFieldFromLayouts, removeTag, updateField, validateFieldName, validateLanguageName,
} from './field-rules';

const extra = (id: string, name: string): FieldDef => ({ id, name, type: 'text', tts: false, required: false, order: 99 });

describe('campos de sistema (I02-1, I02-2)', () => {
  it('un idioma nuevo nace con Palabra, Traducción y Tags', () => {
    const l = createLanguage('  Chino  ', 'zh-CN');
    expect(l.name).toBe('Chino');
    expect(l.fields.map((f) => f.system)).toEqual(['word', 'translation', 'tags']);
    expect(hasSystemFields(l.fields)).toBe(true);
  });

  it('Palabra y Traducción son obligatorias', () => {
    const [word, translation, tags] = createSystemFields();
    expect(word.required && translation.required).toBe(true);
    expect(tags.required).toBe(false);
  });

  it('no se puede eliminar un campo de sistema', () => {
    const fields = createSystemFields();
    expect(() => removeField(fields, 'word')).toThrow();
    expect(() => removeField(fields, 'tags')).toThrow();
  });

  it('no se puede quedar con menos de tres campos de sistema', () => {
    expect(hasSystemFields(createSystemFields().slice(0, 2))).toBe(false);
  });

  it('en los de sistema no se puede cambiar el tipo ni quitar lo obligatorio', () => {
    const fields = createSystemFields();
    const word = { ...fields[0], type: 'number' as const, required: false, name: 'Hanzi' };
    const [updated] = updateField(fields, word);
    expect(updated.type).toBe('text');
    expect(updated.required).toBe(true);
    expect(updated.name).toBe('Hanzi');
    expect(updated.system).toBe('word');
  });
});

describe('ABM de campos (I02-3, I03-1, I03-3)', () => {
  it('agrega, edita, reordena y elimina campos propios', () => {
    let fields = addField(createSystemFields(), extra('pinyin', 'Pinyin'));
    expect(fields.map((f) => f.name)).toEqual(['Palabra', 'Traducción', 'Tags', 'Pinyin']);
    fields = updateField(fields, { ...extra('pinyin', 'Romanización'), order: 3 });
    expect(fields[3].name).toBe('Romanización');
    fields = moveField(fields, 'pinyin', -1);
    expect(fields.map((f) => f.id)).toEqual(['word', 'translation', 'pinyin', 'tags']);
    expect(fields.map((f) => f.order)).toEqual([0, 1, 2, 3]);
    fields = removeField(fields, 'pinyin');
    expect(fields.map((f) => f.id)).toEqual(['word', 'translation', 'tags']);
  });

  it('mover más allá de los extremos no cambia nada', () => {
    const fields = createSystemFields();
    expect(moveField(fields, 'word', -1).map((f) => f.id)).toEqual(['word', 'translation', 'tags']);
    expect(moveField(fields, 'tags', 1).map((f) => f.id)).toEqual(['word', 'translation', 'tags']);
  });

  it('el texto-a-voz solo aplica a campos de tipo texto', () => {
    const fields = addField(createSystemFields(), { ...extra('n', 'Nivel'), type: 'number', tts: true });
    expect(fields[3].tts).toBe(false);
  });

  it('valida nombre vacío o repetido sin distinguir mayúsculas', () => {
    const fields = createSystemFields();
    expect(validateFieldName('  ', fields)).toMatch(/obligatorio/);
    expect(validateFieldName('palabra', fields)).toMatch(/Ya existe/);
    expect(validateFieldName('Palabra', fields, 'word')).toBeNull();
    expect(validateFieldName('Pinyin', fields)).toBeNull();
  });
});

describe('impacto sobre layouts', () => {
  const layouts: Layout[] = [
    { id: 'a', name: 'A', items: [{ fieldId: 'word', col: 1, row: 1, colSpan: 6, rowSpan: 2, textSize: 'XL', align: 'center' }] },
    { id: 'b', name: 'B', items: [{ fieldId: 'translation', col: 1, row: 1, colSpan: 6, rowSpan: 2, textSize: 'L', align: 'left' }] },
  ];
  it('detecta y quita un campo de los layouts', () => {
    expect(layoutsUsingField(layouts, 'word').map((l) => l.id)).toEqual(['a']);
    expect(removeFieldFromLayouts(layouts, 'word')[0].items).toEqual([]);
    expect(removeFieldFromLayouts(layouts, 'word')[1].items).toHaveLength(1);
  });
});

describe('tags (I02-4)', () => {
  it('agrega sin duplicados, sin distinguir mayúsculas', () => {
    let r = addTag([], ' Saludos ');
    expect(r.tags).toEqual(['Saludos']);
    r = addTag(r.tags, 'saludos');
    expect(r.tags).toEqual(['Saludos']);
    expect(r.error).toMatch(/ya existe/);
  });
  it('ignora tags vacíos y permite quitar', () => {
    expect(addTag(['a'], '   ')).toEqual({ tags: ['a'] });
    expect(removeTag(['a', 'b'], 'a')).toEqual(['b']);
  });
});

describe('nombre del idioma (I02-7)', () => {
  const langs = [createLanguage('Chino', 'zh-CN')];
  it('es obligatorio y único', () => {
    expect(validateLanguageName('', langs)).toMatch(/obligatorio/);
    expect(validateLanguageName('chino', langs)).toMatch(/Ya existe/);
    expect(validateLanguageName('chino', langs, langs[0].id)).toBeNull();
    expect(validateLanguageName('Japonés', langs)).toBeNull();
  });
});

describe('MJ7 · renombrar tags', () => {
  it('MJ7-1 renombra conservando la posición y limpia espacios', () => {
    expect(renameTag(['a', 'b', 'c'], 'b', '  B2 ')).toEqual({ tags: ['a', 'B2', 'c'] });
  });

  it('MJ7-2 rechaza vacío y nombres de otro tag (sin distinguir mayúsculas), pero admite cambiar solo las mayúsculas del propio', () => {
    expect(renameTag(['a', 'b'], 'b', '   ')).toMatchObject({ tags: ['a', 'b'], error: expect.stringMatching(/vacío/) });
    expect(renameTag(['Saludos', 'Escuela'], 'Escuela', 'saludos')).toMatchObject({ error: expect.stringMatching(/ya existe/) });
    expect(renameTag(['Saludos', 'Escuela'], 'Escuela', 'ESCUELA')).toEqual({ tags: ['Saludos', 'ESCUELA'] });
  });

  it('MJ7-3 los renombrados sucesivos se encadenan desde el nombre original y volver al original los anula', () => {
    let r = trackRename([], 'A', 'B');
    r = trackRename(r, 'B', 'C');
    expect(r).toEqual([{ from: 'A', to: 'C' }]);
    expect(trackRename(r, 'C', 'A')).toEqual([]);
  });

  it('MJ7-4 quitar un tag renombrado olvida el renombrado y solo valen los que siguen vigentes', () => {
    const r = [{ from: 'A', to: 'B' }, { from: 'X', to: 'Y' }];
    expect(untrackRename(r, 'B')).toEqual([{ from: 'X', to: 'Y' }]);
    expect(effectiveRenames(r, ['A', 'X'], ['B'])).toEqual([{ from: 'A', to: 'B' }]);
  });
});
