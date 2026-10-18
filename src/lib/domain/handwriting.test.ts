import { chinese } from '@/test/fixtures';
import { describeVerdict, DRAW_LAYOUT_ID, drawableChars, handwritingOutcome, layoutOptions, supportsHandwriting } from './handwriting';

describe('E1 · Layout Dibujar solo en chino y japonés', () => {
  it('chino (simplificado o tradicional) y japonés ofrecen Dibujar; el resto no', () => {
    for (const code of ['zh-CN', 'zh-TW', 'ja-JP', 'ZH']) expect(supportsHandwriting({ code })).toBe(true);
    for (const code of ['ko-KR', 'en-US', 'es-ES']) expect(supportsHandwriting({ code })).toBe(false);
  });

  it('layoutOptions agrega Dibujar al final de los layouts del idioma', () => {
    expect(layoutOptions(chinese()).map((o) => o.name)).toEqual(['Palabra y pinyin', 'Solo traducción', 'Dibujar']);
    expect(layoutOptions(chinese()).at(-1)!.id).toBe(DRAW_LAYOUT_ID);
  });

  it('en otros idiomas solo están los layouts propios', () => {
    expect(layoutOptions(chinese({ code: 'en-US' })).map((o) => o.name)).toEqual(['Palabra y pinyin', 'Solo traducción']);
  });
});

describe('drawableChars', () => {
  it('una celda por hanzi, kanji o kana', () => {
    expect(drawableChars('你好')).toEqual(['你', '好']);
    expect(drawableChars('ありがとう')).toHaveLength(5);
    expect(drawableChars('コーヒー')).toEqual(['コ', 'ー', 'ヒ', 'ー']);
    expect(drawableChars('人々')).toEqual(['人', '々']);
  });

  it('ignora espacios, puntuación, letras latinas y números', () => {
    expect(drawableChars(' 你好！ ')).toEqual(['你', '好']);
    expect(drawableChars('T恤 3个')).toEqual(['恤', '个']);
    expect(drawableChars('はい、そう。')).toEqual(['は', 'い', 'そ', 'う']);
    expect(drawableChars('hello')).toEqual([]);
  });
});

describe('E7/E8 · Resultado de la palabra', () => {
  it('correcto si todas las celdas validables están bien', () => {
    expect(handwritingOutcome([{ kind: 'ok' }, { kind: 'ok' }])).toBe('correct');
    expect(handwritingOutcome([{ kind: 'ok' }, { kind: 'unavailable' }])).toBe('correct');
  });

  it('con una celda mal, hay errores', () => {
    expect(handwritingOutcome([{ kind: 'ok' }, { kind: 'error', missing: [1], wrong: [] }])).toBe('errors');
  });

  it('sin celdas validables no se puede validar', () => {
    expect(handwritingOutcome([{ kind: 'unavailable' }])).toBe('unverifiable');
    expect(handwritingOutcome([])).toBe('unverifiable');
  });

  it('describe cada celda', () => {
    expect(describeVerdict({ kind: 'ok' })).toBe('Correcto');
    expect(describeVerdict({ kind: 'unavailable' })).toBe('No se puede validar');
    expect(describeVerdict({ kind: 'error', missing: [0, 1], wrong: [] })).toBe('Faltan 2 trazos');
    expect(describeVerdict({ kind: 'error', missing: [2], wrong: [0] })).toBe('1 trazo mal hecho o de más · falta 1 trazo');
  });
});
