import type { CharVerdict } from './handwriting';

export interface Point {
  x: number;
  y: number;
}

/** Lado de una celda en las unidades de los datos de trazos (Make Me a Hanzi / animCJK), con el eje Y hacia abajo. */
export const CELL_UNITS = 1024;

/** Trazo dibujado, en unidades de su celda (0–1024). Puede salirse un poco de la celda. */
export interface Stroke {
  cell: number;
  points: Point[];
}

/** Celda en píxeles CSS del canvas. */
export interface Cell {
  x: number;
  y: number;
  size: number;
}

export interface Grid {
  cells: Cell[];
  width: number;
  height: number;
}

export interface GridOptions {
  /** Mobile: se ve una celda a la vez, la más grande que entre en `width` × `height`. */
  paged: boolean;
  /** Alto disponible (solo paginado; sin alto, la celda es del ancho). */
  height?: number;
  gap?: number;
  minCell?: number;
  maxCell?: number;
}

/**
 * Ubica las celdas (una por carácter) en un ancho dado. Paginado: todas en el mismo lugar, porque se ve una a la vez.
 * En fila: tantas como entren con `minCell` como mínimo y `maxCell` como máximo, centradas, en varias filas si hace falta.
 */
export function cellGrid(count: number, width: number, { paged, height = 0, gap = 12, minCell = 140, maxCell = 280 }: GridOptions): Grid {
  if (count === 0 || width <= 0) return { cells: [], width: Math.max(width, 0), height: 0 };
  if (paged) {
    const size = height > 0 ? Math.min(width, height) : width;
    return { cells: Array.from({ length: count }, () => ({ x: 0, y: 0, size })), width: size, height: size };
  }
  const cols = Math.max(1, Math.min(count, Math.floor((width + gap) / (minCell + gap))));
  const size = Math.min(maxCell, (width - (cols - 1) * gap) / cols);
  const rows = Math.ceil(count / cols);
  const offset = (width - (cols * size + (cols - 1) * gap)) / 2;
  const cells = Array.from({ length: count }, (_, i) => ({
    x: offset + (i % cols) * (size + gap),
    y: Math.floor(i / cols) * (size + gap),
    size,
  }));
  return { cells, width, height: rows * size + (rows - 1) * gap };
}

const inside = (p: Point, c: Cell) => p.x >= c.x && p.x <= c.x + c.size && p.y >= c.y && p.y <= c.y + c.size;

/** Celda a la que pertenece un trazo (en píxeles): la que contiene la mayoría de sus puntos; si ninguna, la más cercana. */
export function cellOf(points: Point[], cells: Cell[]): number {
  let best = -1;
  let bestCount = 0;
  cells.forEach((c, i) => {
    const count = points.filter((p) => inside(p, c)).length;
    if (count > bestCount) { best = i; bestCount = count; }
  });
  if (best >= 0 || points.length === 0) return Math.max(best, 0);
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  const dist = (c: Cell) => Math.hypot(c.x + c.size / 2 - cx, c.y + c.size / 2 - cy);
  return cells.reduce((b, c, i) => (dist(c) < dist(cells[b]) ? i : b), 0);
}

/** De píxeles del canvas a unidades de la celda. */
export const toCellUnits = (p: Point, c: Cell): Point => ({ x: ((p.x - c.x) / c.size) * CELL_UNITS, y: ((p.y - c.y) / c.size) * CELL_UNITS });

/** De unidades de la celda a píxeles del canvas. */
export const toCanvas = (p: Point, c: Cell): Point => ({ x: c.x + (p.x / CELL_UNITS) * c.size, y: c.y + (p.y / CELL_UNITS) * c.size });

/** Trazos de una celda, en el orden en que se dibujaron. */
export const strokesOfCell = (strokes: Stroke[], cell: number) => strokes.filter((s) => s.cell === cell);

/** Distancia (en píxeles) de un punto a un trazo dibujado en su celda. */
function distanceToStroke(p: Point, stroke: Stroke, cell: Cell): number {
  const pts = stroke.points.map((q) => toCanvas(q, cell));
  if (pts.length === 1) return Math.hypot(p.x - pts[0].x, p.y - pts[0].y);
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const len2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / len2));
    best = Math.min(best, Math.hypot(p.x - (a.x + (b.x - a.x) * t), p.y - (a.y + (b.y - a.y) * t)));
  }
  return best;
}

/**
 * Trazo tocado en `p` (píxeles del canvas): el más cercano a menos de `tolerance` píxeles, y entre iguales el más
 * reciente. Con `cell`, solo se buscan los trazos de esa celda (mobile, una celda a la vez). Sin trazo cerca, -1.
 */
export function strokeAt(strokes: Stroke[], p: Point, cells: Cell[], tolerance: number, cell?: number): number {
  let found = -1;
  let best = tolerance;
  strokes.forEach((s, i) => {
    if ((cell !== undefined && s.cell !== cell) || !cells[s.cell]) return;
    const d = distanceToStroke(p, s, cells[s.cell]);
    if (d <= best) { best = d; found = i; }
  });
  return found;
}

/** Lo dibujado y, si se validó, el resultado por celda. Cualquier cambio en el dibujo descarta el resultado. */
export interface DrawingState {
  strokes: Stroke[];
  verdicts: CharVerdict[] | null;
}

export type DrawingAction =
  | { type: 'add'; stroke: Stroke }
  /** `cell`: deshace el último trazo de esa celda (paginado); sin `cell`, el último de todos. */
  | { type: 'undo'; cell?: number }
  /** Borra un trazo (se tocó). */
  | { type: 'remove'; index: number }
  | { type: 'clear' }
  /** `strokes`: lo que se validó. Si el dibujo cambió mientras se validaba, el resultado se descarta. */
  | { type: 'validated'; verdicts: CharVerdict[]; strokes: Stroke[] };

export const initialDrawing: DrawingState = { strokes: [], verdicts: null };

export function drawingReducer(state: DrawingState, action: DrawingAction): DrawingState {
  switch (action.type) {
    case 'add':
      return { strokes: [...state.strokes, action.stroke], verdicts: null };
    case 'undo': {
      const index = action.cell === undefined ? state.strokes.length - 1 : state.strokes.findLastIndex((s) => s.cell === action.cell);
      return index < 0 ? state : { strokes: state.strokes.filter((_, i) => i !== index), verdicts: null };
    }
    case 'remove':
      return state.strokes[action.index] ? { strokes: state.strokes.filter((_, i) => i !== action.index), verdicts: null } : state;
    case 'clear':
      return initialDrawing;
    case 'validated':
      return action.strokes === state.strokes ? { ...state, verdicts: action.verdicts } : state;
  }
}
