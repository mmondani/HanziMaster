import type { CharVerdict } from '@/lib/domain/handwriting';
import { CELL_UNITS, strokesOfCell, toCanvas, type Cell, type Grid, type Point, type Stroke } from '@/lib/domain/strokes';
import type { CharData } from '@/lib/handwriting/char-data';

/** Colores del tema (tokens CSS), leídos del DOM para respetar el modo claro u oscuro. */
export interface PaintColors {
  ink: string;
  guide: string;
  border: string;
  ok: string;
  okSoft: string;
  err: string;
  errSoft: string;
}

export function readColors(el: Element): PaintColors {
  const style = getComputedStyle(el);
  const token = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    ink: token('--text', '#1E1B4B'),
    guide: token('--border', '#D5DAF0'),
    border: token('--border-strong', '#7A83B5'),
    ok: token('--success', '#15803D'),
    okSoft: token('--success-soft', '#DCFCE7'),
    err: token('--danger', '#C21F1F'),
    errSoft: token('--danger-soft', '#FEE2E2'),
  };
}

/** Grosor del trazo: proporcional a la celda, como un pincel. */
export const inkWidth = (cell: Cell) => Math.max(3, cell.size * 0.032);

/** Línea de base de los contornos de los datos de trazos (eje Y hacia arriba). */
const BASELINE = 900;

function paintCell(ctx: CanvasRenderingContext2D, cell: Cell, verdict: CharVerdict | undefined, colors: PaintColors) {
  const { x, y, size } = cell;
  const tone = verdict?.kind === 'ok' ? 'ok' : verdict?.kind === 'error' ? 'err' : null;
  if (tone) {
    ctx.fillStyle = tone === 'ok' ? colors.okSoft : colors.errSoft;
    ctx.fillRect(x, y, size, size);
  }
  // Guía 田: cruz punteada al medio.
  ctx.save();
  ctx.strokeStyle = colors.guide;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(x + size / 2, y);
  ctx.lineTo(x + size / 2, y + size);
  ctx.moveTo(x, y + size / 2);
  ctx.lineTo(x + size, y + size / 2);
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = tone === 'ok' ? colors.ok : tone === 'err' ? colors.err : colors.border;
  ctx.lineWidth = tone ? 3 : 1.5;
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
}

/** Trazos que faltan: el contorno del trazo correcto, punteado en rojo, en su lugar. */
function paintMissing(ctx: CanvasRenderingContext2D, cell: Cell, outlines: string[], colors: PaintColors) {
  if (typeof Path2D === 'undefined' || outlines.length === 0) return;
  const k = cell.size / CELL_UNITS;
  ctx.save();
  ctx.translate(cell.x, cell.y);
  ctx.scale(k, k);
  ctx.translate(0, BASELINE);
  ctx.scale(1, -1);
  ctx.lineWidth = 2.5 / k;
  ctx.setLineDash([10 / k, 7 / k]);
  ctx.strokeStyle = colors.err;
  for (const outline of outlines) {
    const path = new Path2D(outline);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = colors.err;
    ctx.fill(path);
    ctx.globalAlpha = 1;
    ctx.stroke(path);
  }
  ctx.restore();
}

function paintStroke(ctx: CanvasRenderingContext2D, points: Point[], cell: Cell, color: string) {
  if (points.length === 0) return;
  const pts = points.map((p) => toCanvas(p, cell));
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = inkWidth(cell);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
  ctx.stroke();
}

/**
 * Pinta las celdas, lo dibujado y, si se validó, el resultado: celdas en verde o rojo, trazos propios con error en rojo
 * y los trazos que faltan punteados en su lugar. Con `only` (paginado), solo esa celda.
 */
export function paintDrawing(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  strokes: Stroke[],
  verdicts: CharVerdict[] | null,
  charData: (CharData | null)[],
  colors: PaintColors,
  only?: number,
) {
  ctx.clearRect(0, 0, grid.width, grid.height);
  grid.cells.forEach((cell, i) => {
    if (only !== undefined && i !== only) return;
    const verdict = verdicts?.[i];
    paintCell(ctx, cell, verdict, colors);
    if (verdict?.kind === 'error') paintMissing(ctx, cell, verdict.missing.map((m) => charData[i]?.strokes[m]).filter((s): s is string => Boolean(s)), colors);
    strokesOfCell(strokes, i).forEach((stroke, k) => {
      const wrong = verdict?.kind === 'error' && verdict.wrong.includes(k);
      paintStroke(ctx, stroke.points, cell, wrong ? colors.err : colors.ink);
    });
  });
}

/** Tramo del trazo que se está dibujando (en píxeles del canvas), sin repintar todo. */
export function paintSegment(ctx: CanvasRenderingContext2D, from: Point, to: Point, width: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}
