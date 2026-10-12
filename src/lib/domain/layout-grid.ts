import type { Layout, LayoutItem } from '@/lib/types';

export const GRID_COLUMNS = 6;
export const MAX_ROWS = 12;

export type PlacementResult =
  | { ok: true }
  | { ok: false; reason: 'out-of-bounds' }
  | { ok: false; reason: 'overlap'; withFieldId: string };

type Rect = Pick<LayoutItem, 'col' | 'row' | 'colSpan' | 'rowSpan'>;

function overlaps(a: Rect, b: Rect): boolean {
  return a.col < b.col + b.colSpan && b.col < a.col + a.colSpan && a.row < b.row + b.rowSpan && b.row < a.row + a.rowSpan;
}

/** ¿El rectángulo cabe en la grilla y no pisa a ningún otro campo? */
export function checkPlacement(item: LayoutItem, others: LayoutItem[]): PlacementResult {
  const inside =
    item.col >= 1 && item.row >= 1 && item.colSpan >= 1 && item.rowSpan >= 1 &&
    item.col + item.colSpan - 1 <= GRID_COLUMNS && item.row + item.rowSpan - 1 <= MAX_ROWS;
  if (!inside) return { ok: false, reason: 'out-of-bounds' };
  const clash = others.find((o) => o.fieldId !== item.fieldId && overlaps(item, o));
  return clash ? { ok: false, reason: 'overlap', withFieldId: clash.fieldId } : { ok: true };
}

/** Primera posición libre (de arriba hacia abajo) donde entra un rectángulo del tamaño dado. */
export function findFreeSpot(items: LayoutItem[], colSpan: number, rowSpan: number): { col: number; row: number } | null {
  for (let row = 1; row + rowSpan - 1 <= MAX_ROWS; row++) {
    for (let col = 1; col + colSpan - 1 <= GRID_COLUMNS; col++) {
      if (!items.some((o) => overlaps({ col, row, colSpan, rowSpan }, o))) return { col, row };
    }
  }
  return null;
}

/** Cantidad de filas ocupadas por el contenido del layout. */
export function usedRows(items: LayoutItem[]): number {
  return items.reduce((max, i) => Math.max(max, i.row + i.rowSpan - 1), 0);
}

/** Item nuevo de ancho completo en la primera franja libre, o `null` si la grilla está llena. */
export function createItem(fieldId: string, items: LayoutItem[]): LayoutItem | null {
  const sizes: [number, number][] = [[GRID_COLUMNS, 2], [GRID_COLUMNS, 1], [3, 1], [1, 1]];
  for (const [colSpan, rowSpan] of sizes) {
    const spot = findFreeSpot(items, colSpan, rowSpan);
    if (spot) return { fieldId, ...spot, colSpan, rowSpan, textSize: 'M', align: 'center' };
  }
  return null;
}

export function validateLayoutName(name: string, layouts: Layout[], currentId?: string): string | null {
  if (!name.trim()) return 'El nombre es obligatorio.';
  if (layouts.some((l) => l.id !== currentId && l.name.trim().toLowerCase() === name.trim().toLowerCase())) return 'Ya existe un layout con ese nombre.';
  return null;
}
