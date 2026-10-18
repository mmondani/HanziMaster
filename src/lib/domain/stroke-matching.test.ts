import { strokeData } from '@/test/stroke-fixtures';
import type { Point } from './strokes';
import { DEFAULT_TOLERANCES, frechet, judgeCharacter, matchCharacter, resample } from './stroke-matching';

/** Imprecisión de la mano, determinista: una ondulación suave de ±`amount` unidades más un temblor fino de ±4. */
function jitter(stroke: Point[], amount = 18, seed = 1): Point[] {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280) * 2 - 1;
  const phase = rnd() * Math.PI;
  return resample(stroke, 30).map((p, i) => ({
    x: p.x + Math.sin(phase + i / 5) * amount + rnd() * 4,
    y: p.y + Math.cos(phase + i / 7) * amount + rnd() * 4,
  }));
}

/** "Dibuja" el carácter con sus propias medians, con ruido. */
const handwritten = (char: string) => strokeData(char).medians.map((m, i) => jitter(m, 18, i + 1));
const expected = (char: string) => strokeData(char).medians;

describe('E6 · Comparación por trazos, sin orden ni dirección', () => {
  it.each(['口', '你', '好', '三', '学', '見', 'い', 'ア', 'ー'])('%s bien escrito es correcto', (char) => {
    expect(matchCharacter(handwritten(char), expected(char))).toEqual({ missing: [], wrong: [] });
  });

  it('el orden de los trazos no importa', () => {
    const strokes = handwritten('你');
    expect(matchCharacter([...strokes].reverse(), expected('你'))).toEqual({ missing: [], wrong: [] });
    const shuffled = [strokes[3], strokes[0], strokes[6], strokes[1], strokes[5], strokes[2], strokes[4]];
    expect(matchCharacter(shuffled, expected('你'))).toEqual({ missing: [], wrong: [] });
  });

  it('la dirección de los trazos no importa', () => {
    const reversed = handwritten('好').map((s) => [...s].reverse());
    expect(matchCharacter(reversed, expected('好'))).toEqual({ missing: [], wrong: [] });
  });

  it('trazos parecidos (los tres horizontales de 三) se emparejan bien en cualquier orden', () => {
    const [a, b, c] = handwritten('三');
    expect(matchCharacter([c, a, b], expected('三'))).toEqual({ missing: [], wrong: [] });
  });

  it('tolera escribir el carácter más chico y corrido dentro de la celda', () => {
    const small = handwritten('口').map((s) => s.map((p) => ({ x: 150 + p.x * 0.7, y: 120 + p.y * 0.7 })));
    expect(matchCharacter(small, expected('口'))).toEqual({ missing: [], wrong: [] });
  });
});

describe('E7 · Detecta y señala los errores', () => {
  it('un trazo que falta', () => {
    const strokes = handwritten('好');
    strokes.splice(2, 1);
    expect(matchCharacter(strokes, expected('好'))).toEqual({ missing: [2], wrong: [] });
  });

  it('un trazo de más', () => {
    const extra = [{ x: 100, y: 900 }, { x: 900, y: 100 }];
    expect(matchCharacter([...handwritten('口'), extra], expected('口'))).toEqual({ missing: [], wrong: [3] });
  });

  it('un trazo incompleto (el 横折 de 口 sin la bajada) es un trazo mal hecho y uno que falta', () => {
    const strokes = handwritten('口');
    const corner = expected('口')[1].reduce((best, p) => (p.x - p.y > best.x - best.y ? p : best));
    const start = expected('口')[1][0];
    strokes[1] = jitter([start, corner]);
    expect(matchCharacter(strokes, expected('口'))).toEqual({ missing: [1], wrong: [1] });
  });

  it('un trazo a la mitad de su largo (el vertical de 十) no pasa', () => {
    const [h, v] = expected('十');
    const end = v[v.length - 1];
    const half = { x: (v[0].x + end.x) / 2, y: (v[0].y + end.y) / 2 };
    expect(matchCharacter([jitter(h, 30, 1), jitter([v[0], half], 30, 2)], expected('十'))).toEqual({ missing: [1], wrong: [1] });
  });

  it('otro carácter con la misma cantidad de trazos no pasa', () => {
    const result = matchCharacter(handwritten('三'), expected('口'));
    expect(result.missing.length + result.wrong.length).toBeGreaterThan(0);
  });

  it('una celda vacía tiene todos los trazos faltantes', () => {
    expect(matchCharacter([], expected('口'))).toEqual({ missing: [0, 1, 2], wrong: [] });
  });

  it('un toque (trazo sin largo) no cuenta como trazo', () => {
    const tap = [{ x: 500, y: 500 }];
    expect(matchCharacter([...handwritten('口'), tap], expected('口')).wrong).toEqual([3]);
  });
});

describe('judgeCharacter', () => {
  it('ok, error o sin datos', () => {
    expect(judgeCharacter(handwritten('人'), expected('人'))).toEqual({ kind: 'ok' });
    expect(judgeCharacter(handwritten('人').slice(1), expected('人'))).toEqual({ kind: 'error', missing: [0], wrong: [] });
    expect(judgeCharacter(handwritten('人'), null)).toEqual({ kind: 'unavailable' });
  });

  it('las tolerancias se pueden ajustar', () => {
    const strict = { ...DEFAULT_TOLERANCES, maxFrechet: 5, maxShape: 0.01 };
    expect(judgeCharacter(handwritten('人'), expected('人'), strict)).toMatchObject({ kind: 'error', missing: [0, 1] });
  });
});

describe('geometría', () => {
  it('resample reparte puntos equidistantes', () => {
    const pts = resample([{ x: 0, y: 0 }, { x: 100, y: 0 }], 5);
    expect(pts.map((p) => p.x)).toEqual([0, 25, 50, 75, 100]);
  });

  it('Fréchet de un trazo consigo mismo es 0 y crece con la separación', () => {
    const line = resample([{ x: 0, y: 0 }, { x: 100, y: 0 }], 10);
    expect(frechet(line, line)).toBe(0);
    expect(frechet(line, line.map((p) => ({ ...p, y: 30 })))).toBeCloseTo(30);
  });
});
