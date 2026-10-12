import type { LayoutItem } from '@/lib/types';
import { MAX_ROWS, checkPlacement, createItem, findFreeSpot, usedRows, validateLayoutName } from './layout-grid';

const item = (fieldId: string, col: number, row: number, colSpan: number, rowSpan: number): LayoutItem => ({
  fieldId, col, row, colSpan, rowSpan, textSize: 'M', align: 'center',
});

describe('checkPlacement (I04-3)', () => {
  it('acepta un campo dentro de la grilla sin solapes', () => {
    expect(checkPlacement(item('a', 1, 1, 6, 2), [item('b', 1, 3, 6, 1)])).toEqual({ ok: true });
  });
  it('rechaza salirse por la derecha o por abajo', () => {
    expect(checkPlacement(item('a', 5, 1, 3, 1), [])).toEqual({ ok: false, reason: 'out-of-bounds' });
    expect(checkPlacement(item('a', 1, MAX_ROWS, 1, 2), [])).toEqual({ ok: false, reason: 'out-of-bounds' });
    expect(checkPlacement(item('a', 0, 1, 1, 1), [])).toEqual({ ok: false, reason: 'out-of-bounds' });
  });
  it('rechaza solapes e informa con qué campo', () => {
    expect(checkPlacement(item('a', 1, 1, 3, 2), [item('b', 3, 2, 2, 2)])).toEqual({ ok: false, reason: 'overlap', withFieldId: 'b' });
  });
  it('dos campos que se tocan en el borde no se solapan', () => {
    expect(checkPlacement(item('a', 1, 1, 3, 1), [item('b', 4, 1, 3, 1)])).toEqual({ ok: true });
  });
  it('un campo no se solapa consigo mismo', () => {
    expect(checkPlacement(item('a', 1, 1, 6, 2), [item('a', 1, 1, 6, 2)])).toEqual({ ok: true });
  });
});

describe('colocación automática (I04-1)', () => {
  it('el primer campo ocupa el ancho completo arriba', () => {
    expect(createItem('a', [])).toMatchObject({ col: 1, row: 1, colSpan: 6, rowSpan: 2 });
  });
  it('los siguientes se colocan debajo sin pisar', () => {
    const first = createItem('a', [])!;
    expect(createItem('b', [first])).toMatchObject({ col: 1, row: 3 });
  });
  it('devuelve null si la grilla está llena', () => {
    const full = Array.from({ length: MAX_ROWS }, (_, r) => item(`f${r}`, 1, r + 1, 6, 1));
    expect(createItem('x', full)).toBeNull();
    expect(findFreeSpot(full, 1, 1)).toBeNull();
  });
  it('calcula las filas usadas', () => {
    expect(usedRows([])).toBe(0);
    expect(usedRows([item('a', 1, 1, 6, 4), item('b', 1, 5, 6, 1)])).toBe(5);
  });
});

describe('nombre del layout (I04-4)', () => {
  const layouts = [{ id: 'l1', name: 'Palabra y pinyin', items: [] }];
  it('es obligatorio y único dentro del idioma', () => {
    expect(validateLayoutName('', layouts)).toMatch(/obligatorio/);
    expect(validateLayoutName('palabra y PINYIN', layouts)).toMatch(/Ya existe/);
    expect(validateLayoutName('palabra y pinyin', layouts, 'l1')).toBeNull();
    expect(validateLayoutName('Otro', layouts)).toBeNull();
  });
});
