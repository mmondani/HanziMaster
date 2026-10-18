import type { CharVerdict } from './handwriting';
import { CELL_UNITS, type Point } from './strokes';

/** Puntos con los que se remuestrea cada trazo antes de compararlo. */
const SAMPLES = 24;
/** Costo de una pareja incompatible: más que la suma de cualquier conjunto de parejas válidas. */
const INCOMPATIBLE = 1e9;

export interface Tolerances {
  /** Distancia de Fréchet máxima (unidades de celda) entre el trazo dibujado y el esperado: posición y recorrido. */
  maxFrechet: number;
  /** Distancia de Fréchet máxima entre las formas sin posición ni tamaño (cada trazo centrado y dividido por su largo). */
  maxShape: number;
  /** Largo del trazo dibujado respecto del esperado. */
  minLengthRatio: number;
  maxLengthRatio: number;
  /** Ajuste de tamaño permitido al alinear lo dibujado con el carácter. */
  minFitScale: number;
  maxFitScale: number;
}

/** Nivel relajado: acepta escritura desprolija y sigue rechazando trazos incompletos y otros caracteres. */
export const DEFAULT_TOLERANCES: Tolerances = {
  maxFrechet: 240,
  maxShape: 0.52,
  minLengthRatio: 0.35,
  maxLengthRatio: 3,
  minFitScale: 0.6,
  maxFitScale: 1.8,
};

export interface CharMatch {
  /** Índices de los trazos del carácter que no tienen pareja (faltan). */
  missing: number[];
  /** Índices de los trazos dibujados que no tienen pareja (mal hechos o de más). */
  wrong: number[];
}

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function pathLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += dist(points[i - 1], points[i]);
  return total;
}

/** `n` puntos equidistantes a lo largo del trazo. */
export function resample(points: Point[], n = SAMPLES): Point[] {
  const total = pathLength(points);
  if (points.length === 0) return [];
  if (total === 0) return Array.from({ length: n }, () => points[0]);
  const out: Point[] = [points[0]];
  const step = total / (n - 1);
  let i = 1;
  let travelled = 0;
  let prev = points[0];
  for (let k = 1; k < n - 1; k++) {
    const target = k * step;
    while (i < points.length && travelled + dist(prev, points[i]) < target) {
      travelled += dist(prev, points[i]);
      prev = points[i];
      i++;
    }
    if (i >= points.length) break;
    const t = (target - travelled) / dist(prev, points[i]);
    out.push({ x: prev.x + (points[i].x - prev.x) * t, y: prev.y + (points[i].y - prev.y) * t });
  }
  while (out.length < n) out.push(points[points.length - 1]);
  return out;
}

/** Distancia de Fréchet discreta: la mayor separación al recorrer los dos trazos a la par, del inicio al fin. */
export function frechet(a: Point[], b: Point[]): number {
  const m = b.length;
  const ca = new Float64Array(a.length * m);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < m; j++) {
      const d = dist(a[i], b[j]);
      const k = i * m + j;
      if (i === 0 && j === 0) ca[k] = d;
      else if (i === 0) ca[k] = Math.max(ca[k - 1], d);
      else if (j === 0) ca[k] = Math.max(ca[k - m], d);
      else ca[k] = Math.max(Math.min(ca[k - m], ca[k - m - 1], ca[k - 1]), d);
    }
  }
  return ca[a.length * m - 1];
}

/** Forma del trazo sin posición ni tamaño: centrado en su promedio y dividido por su largo. */
function shapeOf(points: Point[]): Point[] {
  const len = pathLength(points) || 1;
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  return points.map((p) => ({ x: (p.x - cx) / len, y: (p.y - cy) / len }));
}

/** Promedio móvil de 3 puntos (conserva los extremos): quita el temblor fino del dedo o el mouse. */
function smooth(points: Point[]): Point[] {
  return points.map((p, i) =>
    i === 0 || i === points.length - 1
      ? p
      : { x: (points[i - 1].x + p.x + points[i + 1].x) / 3, y: (points[i - 1].y + p.y + points[i + 1].y) / 3 },
  );
}

interface Prepared {
  points: Point[];
  shape: Point[];
  length: number;
}

/** Remuestrea y suaviza; el largo se mide sobre el trazo suavizado para que el temblor no lo infle. */
function prepare(points: Point[]): Prepared {
  const sampled = smooth(resample(points));
  return { points: sampled, shape: shapeOf(sampled), length: pathLength(sampled) };
}

interface UserStroke {
  forward: Prepared;
  backward: Prepared;
}

/**
 * Costo de emparejar un trazo dibujado con uno esperado, o `INCOMPATIBLE`. Se prueba el trazo en los dos sentidos:
 * la dirección en la que se dibujó no importa.
 */
function pairCost(drawn: UserStroke, expected: Prepared, tol: Tolerances): number {
  const ratio = drawn.forward.length / (expected.length || 1);
  if (ratio < tol.minLengthRatio || ratio > tol.maxLengthRatio) return INCOMPATIBLE;
  let best = INCOMPATIBLE;
  for (const candidate of [drawn.forward, drawn.backward]) {
    const position = frechet(candidate.points, expected.points);
    if (position > tol.maxFrechet) continue;
    const shape = frechet(candidate.shape, expected.shape);
    if (shape > tol.maxShape) continue;
    best = Math.min(best, position + shape * CELL_UNITS * 0.5);
  }
  return best;
}

/** Asignación de costo mínimo (algoritmo húngaro) en una matriz cuadrada. Devuelve la columna de cada fila. */
function hungarian(cost: number[][]): number[] {
  const n = cost.length;
  const u = new Array<number>(n + 1).fill(0);
  const v = new Array<number>(n + 1).fill(0);
  const p = new Array<number>(n + 1).fill(0);
  const way = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array<number>(n + 1).fill(Infinity);
    const used = new Array<boolean>(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }
  const assignment = new Array<number>(n).fill(-1);
  for (let j = 1; j <= n; j++) if (p[j] > 0) assignment[p[j] - 1] = j - 1;
  return assignment;
}

interface Assignment extends CharMatch {
  cost: number;
}

/** Empareja uno a uno los trazos dibujados con los esperados minimizando el costo total, sin importar el orden. */
function assign(drawn: Point[][], expected: Point[][], tol: Tolerances): Assignment {
  const user = drawn.map((s) => ({ forward: prepare(s), backward: prepare([...s].reverse()) }));
  const target = expected.map(prepare);
  const n = Math.max(user.length, target.length);
  const cost = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i < user.length && j < target.length ? pairCost(user[i], target[j], tol) : INCOMPATIBLE)),
  );
  const columns = n > 0 ? hungarian(cost) : [];
  const matchedUser = new Set<number>();
  const matchedTarget = new Set<number>();
  let total = 0;
  columns.forEach((j, i) => {
    if (i < user.length && j < target.length && cost[i][j] < INCOMPATIBLE) {
      matchedUser.add(i);
      matchedTarget.add(j);
      total += cost[i][j];
    }
  });
  return {
    missing: target.map((_, j) => j).filter((j) => !matchedTarget.has(j)),
    wrong: user.map((_, i) => i).filter((i) => !matchedUser.has(i)),
    cost: total,
  };
}

interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function boxOf(strokes: Point[][]): Box {
  const all = strokes.flat();
  return {
    minX: Math.min(...all.map((p) => p.x)),
    minY: Math.min(...all.map((p) => p.y)),
    maxX: Math.max(...all.map((p) => p.x)),
    maxY: Math.max(...all.map((p) => p.y)),
  };
}

/** Lo dibujado escalado y desplazado para ocupar la misma caja que el carácter (tolera escribir más chico o corrido). */
function fitToBox(drawn: Point[][], expected: Point[][], tol: Tolerances): Point[][] {
  const from = boxOf(drawn);
  const to = boxOf(expected);
  const size = (b: Box) => Math.max(b.maxX - b.minX, b.maxY - b.minY, 1);
  const scale = Math.min(tol.maxFitScale, Math.max(tol.minFitScale, size(to) / size(from)));
  const fx = (from.minX + from.maxX) / 2;
  const fy = (from.minY + from.maxY) / 2;
  const tx = (to.minX + to.maxX) / 2;
  const ty = (to.minY + to.maxY) / 2;
  return drawn.map((s) => s.map((p) => ({ x: tx + (p.x - fx) * scale, y: ty + (p.y - fy) * scale })));
}

/**
 * Compara lo dibujado en una celda con los trazos de un carácter (medians, en unidades de celda con Y hacia abajo).
 * No importan el orden ni la dirección de los trazos: cada trazo dibujado se empareja con el esperado más parecido.
 * Se prueba lo dibujado tal cual y ajustado a la caja del carácter, y se queda con lo que empareje más trazos.
 */
export function matchCharacter(drawn: Point[][], expected: Point[][], tol = DEFAULT_TOLERANCES): CharMatch {
  const strokes = drawn.filter((s) => s.length > 0);
  if (strokes.length === 0) return { missing: expected.map((_, j) => j), wrong: [] };
  const asDrawn = assign(strokes, expected, tol);
  const fitted = assign(fitToBox(strokes, expected, tol), expected, tol);
  const unmatched = (a: Assignment) => a.missing.length + a.wrong.length;
  const best = unmatched(fitted) < unmatched(asDrawn) || (unmatched(fitted) === unmatched(asDrawn) && fitted.cost < asDrawn.cost) ? fitted : asDrawn;
  // Los índices de `wrong` se refieren a `drawn` (con los trazos vacíos incluidos).
  const indexOf = drawn.map((_, i) => i).filter((i) => drawn[i].length > 0);
  return { missing: best.missing, wrong: best.wrong.map((i) => indexOf[i]) };
}

/** Veredicto de una celda: sin datos del carácter no se puede validar. */
export function judgeCharacter(drawn: Point[][], expected: Point[][] | null, tol = DEFAULT_TOLERANCES): CharVerdict {
  if (!expected) return { kind: 'unavailable' };
  const { missing, wrong } = matchCharacter(drawn, expected, tol);
  return missing.length === 0 && wrong.length === 0 ? { kind: 'ok' } : { kind: 'error', missing, wrong };
}
