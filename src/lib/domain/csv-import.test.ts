import { addField } from '@/lib/domain/field-rules';
import { chinese } from '@/test/fixtures';
import { analyzeCsv, buildSkippedCsv, buildTemplate, describeSkipped, expectedColumns, toFlashcards, MAX_CSV_ROWS } from './csv-import';

const base = chinese({ tags: ['Saludos', 'HSK1'] });
const language = {
  ...base,
  fields: addField(base.fields, { id: 'nivel', name: 'Nivel', type: 'number', tts: false, required: false, order: 9 }),
};

const HEADER = 'Palabra,Pinyin,Traducción,Nivel,Tags';

function ok(text: string, existing: string[] = []) {
  const a = analyzeCsv(language, text, existing);
  if (!a.ok) throw new Error(a.error);
  return a;
}

describe('expectedColumns / buildTemplate (F05-2)', () => {
  it('una columna por campo, con el nombre del campo como encabezado', () => {
    expect(expectedColumns(language).map((c) => [c.header, c.required])).toEqual([
      ['Palabra', true], ['Pinyin', false], ['Traducción', true], ['Tags', false], ['Nivel', false],
    ]);
  });
  it('la plantilla es solo el encabezado', () => {
    expect(buildTemplate(language)).toBe('Palabra,Pinyin,Traducción,Tags,Nivel\r\n');
  });
});

describe('analyzeCsv · archivo (F05-6, F05-8)', () => {
  it('rechaza un archivo sin las columnas obligatorias indicando cuál falta', () => {
    const a = analyzeCsv(language, 'Palabra,Pinyin\n你好,nǐ hǎo', []);
    expect(a).toEqual({ ok: false, error: 'Falta la columna obligatoria «Traducción». Revisa el encabezado o descarga la plantilla.' });
  });
  it('indica todas las que faltan', () => {
    const a = analyzeCsv(language, 'Pinyin\nx', []);
    expect(a.ok === false && a.error).toMatch(/Faltan las columnas obligatorias «Palabra», «Traducción»/);
  });
  it('el encabezado no distingue mayúsculas ni acentos', () => {
    const a = ok('palabra,TRADUCCION\n你好,hola');
    expect(a.valid).toBe(1);
  });
  it('ignora (y avisa) las columnas que no corresponden a ningún campo', () => {
    const a = ok('Palabra,Traducción,Color\n你好,hola,rojo');
    expect(a.ignored).toEqual(['Color']);
    expect(a.valid).toBe(1);
  });
  it('acepta punto y coma y tabulación como separador, y BOM', () => {
    expect(ok('﻿Palabra;Traducción\n你好;hola').valid).toBe(1);
    expect(ok('Palabra\tTraducción\n你好\thola').valid).toBe(1);
  });
  it('rechaza archivos vacíos, sin filas, con texto mal codificado o demasiado grandes', () => {
    expect(analyzeCsv(language, '  ', [])).toMatchObject({ ok: false, error: 'El archivo está vacío.' });
    expect(analyzeCsv(language, 'Palabra,Traducción', [])).toMatchObject({ ok: false, error: 'El archivo no tiene filas para importar.' });
    expect(analyzeCsv(language, 'Palabra,Traducción\n�,x', [])).toMatchObject({ ok: false, error: expect.stringContaining('UTF-8') });
    const big = ['Palabra,Traducción', ...Array.from({ length: MAX_CSV_ROWS + 1 }, (_, i) => `w${i},t`)].join('\n');
    expect(analyzeCsv(language, big, [])).toMatchObject({ ok: false, error: expect.stringContaining('máximo es 1.000') });
  });
  it('soporta comillas y comas dentro de un valor', () => {
    const a = ok('Palabra,Traducción\n你好,"hola, buen día"');
    expect(a.rows[0].values?.translation).toBe('hola, buen día');
  });
});

describe('analyzeCsv · filas (F05-3, F05-4, F05-9)', () => {
  it('importa las filas válidas con sus valores tipados y tags', () => {
    const a = ok(`${HEADER}\n你好,nǐ hǎo,hola,2,Saludos;HSK1`);
    expect(a.rows[0]).toMatchObject({ status: 'ok', line: 1, tags: ['Saludos', 'HSK1'] });
    expect(a.rows[0].values).toEqual({ word: '你好', pinyin: 'nǐ hǎo', translation: 'hola', nivel: 2 });
  });
  it('omite las filas sin un campo obligatorio, con el motivo', () => {
    const a = ok(`${HEADER}\n医院,yīyuàn,,,Lugares\n,x,y,,`);
    expect(a.rows.map((r) => [r.status, r.reason])).toEqual([['invalid', 'Falta Traducción'], ['invalid', 'Falta Palabra']]);
    expect(a.valid).toBe(0);
  });
  it('omite números con formato inválido', () => {
    const a = ok(`${HEADER}\n你好,,hola,abc,`);
    expect(a.rows[0]).toMatchObject({ status: 'invalid', reason: 'Número inválido en Nivel' });
  });
  it('F05-9 omite las palabras que ya existen y las repetidas dentro del archivo', () => {
    const a = ok(`${HEADER}\n你好,,hola,,\n谢谢,,gracias,,\n谢谢,,otra,,\n再见,,adiós,,`, ['你好']);
    expect(a.rows.map((r) => r.status)).toEqual(['duplicate', 'ok', 'duplicate', 'ok']);
    expect(a.rows[0].reason).toBe('Palabra duplicada');
    expect(a.valid).toBe(2);
  });
  it('el duplicado no distingue mayúsculas ni espacios', () => {
    const l = { ...language, code: 'es-ES' };
    const a = analyzeCsv(l, 'Palabra,Traducción\n Hola ,x', ['hola']);
    expect(a.ok && a.rows[0].status).toBe('duplicate');
  });
  it('omite filas completamente vacías', () => {
    const a = ok(`${HEADER}\n你好,,hola,,\n,,,,\n\n谢谢,,gracias,,`);
    expect(a.rows).toHaveLength(2);
  });
});

describe('tags nuevos (F05-5)', () => {
  it('detecta los tags que no existen, sin distinguir mayúsculas, y respeta el nombre existente', () => {
    const a = ok(`${HEADER}\n你好,,hola,,saludos;Viajes\n谢谢,,gracias,,Viajes;Clima`);
    expect(a.rows[0].tags).toEqual(['Saludos', 'Viajes']);
    expect(a.newTags).toEqual(['Viajes', 'Clima']);
  });
  it('los tags de filas omitidas no cuentan como nuevos', () => {
    const a = ok(`${HEADER}\n你好,,,,Fantasma\n谢谢,,gracias,,`);
    expect(a.newTags).toEqual([]);
  });
});

describe('toFlashcards / filas omitidas / resumen', () => {
  it('crea flashcards solo de las filas válidas', () => {
    const a = ok(`${HEADER}\n你好,,hola,,Saludos\n医院,,,,`);
    const cards = toFlashcards(language, a.rows, 5);
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ languageId: 'zh', tags: ['Saludos'], createdAt: 5, updatedAt: 5 });
    expect(cards[0].id).toBeTruthy();
  });
  it('F05-4 genera un CSV con las filas omitidas y el motivo', () => {
    const a = ok(`${HEADER}\n你好,,hola,,\n医院,yīyuàn,,,Lugares`);
    expect(buildSkippedCsv(a.headers, a.rows)).toBe('Palabra,Pinyin,Traducción,Nivel,Tags,Motivo\r\n医院,yīyuàn,,,Lugares,Falta Traducción\r\n');
  });
  it('resume las filas omitidas', () => {
    const a = ok(`${HEADER}\n医院,,,,\n你好,,hola,,\n你好,,x,,`);
    expect(describeSkipped(a.rows)).toBe('fila 1 (falta traducción) y fila 3 (palabra duplicada)');
    const many = ok(`Palabra,Traducción\n${Array.from({ length: 8 }, (_, i) => `w${i},`).join('\n')}`);
    expect(describeSkipped(many.rows, 3)).toBe('fila 1 (falta traducción), fila 2 (falta traducción), fila 3 (falta traducción) y 5 más');
  });
});
