import { cellGrid, cellOf, drawingReducer, initialDrawing, strokeAt, strokesOfCell, toCanvas, toCellUnits, type Stroke } from './strokes';

const stroke = (cell: number): Stroke => ({ cell, points: [{ x: 0, y: 0 }, { x: 100, y: 100 }] });

describe('E3/E4 · Deshacer y borrar', () => {
  it('cada trazo se agrega en orden', () => {
    const s = [stroke(0), stroke(1)].reduce((st, k) => drawingReducer(st, { type: 'add', stroke: k }), initialDrawing);
    expect(s.strokes.map((k) => k.cell)).toEqual([0, 1]);
  });

  it('deshacer quita solo el último trazo, uno por vez', () => {
    let s = [stroke(0), stroke(0), stroke(1)].reduce((st, k) => drawingReducer(st, { type: 'add', stroke: k }), initialDrawing);
    s = drawingReducer(s, { type: 'undo' });
    expect(s.strokes.map((k) => k.cell)).toEqual([0, 0]);
    s = drawingReducer(s, { type: 'undo' });
    expect(s.strokes).toHaveLength(1);
  });

  it('deshacer sin trazos no cambia nada', () => {
    expect(drawingReducer(initialDrawing, { type: 'undo' })).toBe(initialDrawing);
  });

  it('en mobile, deshacer quita el último trazo del carácter que se está viendo', () => {
    const a = { ...stroke(0), points: [{ x: 1, y: 1 }] };
    const s = [a, stroke(1), stroke(0), stroke(1)].reduce((st, k) => drawingReducer(st, { type: 'add', stroke: k }), initialDrawing);
    const undone = drawingReducer(s, { type: 'undo', cell: 0 });
    expect(undone.strokes).toHaveLength(3);
    expect(strokesOfCell(undone.strokes, 0)).toEqual([a]);
    expect(drawingReducer(s, { type: 'undo', cell: 2 })).toBe(s);
  });

  it('tocar un trazo lo borra (solo ese) y descarta el resultado', () => {
    const a = stroke(0);
    const b = { ...stroke(0), points: [{ x: 1, y: 1 }] };
    const s = drawingReducer(drawingReducer(initialDrawing, { type: 'add', stroke: a }), { type: 'add', stroke: b });
    const validated = drawingReducer(s, { type: 'validated', verdicts: [{ kind: 'ok' }], strokes: s.strokes });
    expect(drawingReducer(validated, { type: 'remove', index: 0 })).toEqual({ strokes: [b], verdicts: null });
    expect(drawingReducer(s, { type: 'remove', index: 5 })).toBe(s);
  });

  it('borrar deja el dibujo vacío', () => {
    const s = drawingReducer(drawingReducer(initialDrawing, { type: 'add', stroke: stroke(0) }), { type: 'clear' });
    expect(s).toEqual({ strokes: [], verdicts: null });
  });

  it('cualquier cambio en el dibujo descarta el resultado de la validación', () => {
    const drawn = drawingReducer(initialDrawing, { type: 'add', stroke: stroke(0) });
    const validated = drawingReducer(drawn, { type: 'validated', verdicts: [{ kind: 'ok' }], strokes: drawn.strokes });
    expect(validated.verdicts).toEqual([{ kind: 'ok' }]);
    expect(drawingReducer(validated, { type: 'add', stroke: stroke(0) }).verdicts).toBeNull();
    expect(drawingReducer(validated, { type: 'undo' }).verdicts).toBeNull();
  });

  it('un resultado de un dibujo que ya cambió (se siguió dibujando mientras se validaba) se ignora', () => {
    const drawn = drawingReducer(initialDrawing, { type: 'add', stroke: stroke(0) });
    const more = drawingReducer(drawn, { type: 'add', stroke: stroke(0) });
    expect(drawingReducer(more, { type: 'validated', verdicts: [{ kind: 'ok' }], strokes: drawn.strokes })).toBe(more);
  });
});

describe('cellGrid · una celda por carácter', () => {
  it('en mobile, una celda a la vez: la más grande que entra en el área', () => {
    const grid = cellGrid(3, 300, { paged: true, height: 260 });
    expect(grid.cells).toEqual([{ x: 0, y: 0, size: 260 }, { x: 0, y: 0, size: 260 }, { x: 0, y: 0, size: 260 }]);
    expect(grid).toMatchObject({ width: 260, height: 260 });
    expect(cellGrid(1, 300, { paged: true, height: 500 }).cells[0].size).toBe(300);
  });

  it('en desktop, en fila, con tamaño máximo y centradas', () => {
    const grid = cellGrid(2, 700, { paged: false, gap: 10, minCell: 140, maxCell: 280 });
    expect(grid.cells.map((c) => c.size)).toEqual([280, 280]);
    expect(grid.cells[0].x).toBe((700 - 570) / 2);
    expect(grid.cells[1].x).toBe(grid.cells[0].x + 290);
    expect(grid.height).toBe(280);
  });

  it('si no entran en una fila, pasan a varias filas sin bajar del tamaño mínimo', () => {
    const grid = cellGrid(5, 460, { paged: false, gap: 10, minCell: 140, maxCell: 280 });
    expect(grid.cells.every((c) => c.size >= 140)).toBe(true);
    expect(new Set(grid.cells.map((c) => c.y)).size).toBe(2);
    expect(grid.height).toBe(grid.cells[0].size * 2 + 10);
  });

  it('sin caracteres no hay celdas', () => {
    expect(cellGrid(0, 300, { paged: true }).cells).toEqual([]);
  });
});

describe('cellOf · a qué carácter pertenece un trazo', () => {
  const cells = cellGrid(2, 410, { paged: false, gap: 10, minCell: 100, maxCell: 200 }).cells; // x: 0–200 y 210–410

  it('la celda que contiene la mayoría de los puntos, aunque el trazo cruce el borde', () => {
    const crossing = [{ x: 150, y: 50 }, { x: 180, y: 50 }, { x: 195, y: 50 }, { x: 220, y: 50 }];
    expect(cellOf(crossing, cells)).toBe(0);
    expect(cellOf([{ x: 190, y: 50 }, { x: 230, y: 50 }, { x: 260, y: 50 }], cells)).toBe(1);
  });

  it('un trazo fuera de todas las celdas va a la más cercana', () => {
    expect(cellOf([{ x: 405, y: 270 }, { x: 409, y: 310 }], cells)).toBe(1);
  });

  it('conversión ida y vuelta entre píxeles y unidades de la celda', () => {
    const cell = { x: 210, y: 0, size: 200 };
    expect(toCellUnits({ x: 310, y: 100 }, cell)).toEqual({ x: 512, y: 512 });
    expect(toCanvas({ x: 512, y: 512 }, cell)).toEqual({ x: 310, y: 100 });
  });

  it('strokesOfCell filtra en el orden de dibujo', () => {
    expect(strokesOfCell([stroke(1), stroke(0), stroke(1)], 1)).toHaveLength(2);
  });
});

describe('strokeAt · qué trazo se tocó', () => {
  const cells = [{ x: 0, y: 0, size: 200 }, { x: 210, y: 0, size: 200 }];
  // Horizontal en el medio de la celda 0 (y = 100 px) y vertical en el medio de la celda 1 (x = 310 px).
  const horizontal: Stroke = { cell: 0, points: [{ x: 100, y: 512 }, { x: 900, y: 512 }] };
  const vertical: Stroke = { cell: 1, points: [{ x: 512, y: 100 }, { x: 512, y: 900 }] };

  it('el trazo bajo el dedo, con tolerancia', () => {
    expect(strokeAt([horizontal, vertical], { x: 100, y: 108 }, cells, 12)).toBe(0);
    expect(strokeAt([horizontal, vertical], { x: 315, y: 60 }, cells, 12)).toBe(1);
  });

  it('lejos de todo trazo, ninguno', () => {
    expect(strokeAt([horizontal, vertical], { x: 100, y: 150 }, cells, 12)).toBe(-1);
  });

  it('entre dos trazos cerca, el más cercano; si empatan, el más reciente', () => {
    const near: Stroke = { cell: 0, points: [{ x: 100, y: 562 }, { x: 900, y: 562 }] }; // y = 110 px
    expect(strokeAt([horizontal, near], { x: 100, y: 108 }, cells, 12)).toBe(1);
    expect(strokeAt([horizontal, horizontal], { x: 100, y: 100 }, cells, 12)).toBe(1);
  });

  it('con una celda indicada, solo busca en esa', () => {
    const paged = [{ x: 0, y: 0, size: 200 }, { x: 0, y: 0, size: 200 }];
    const other: Stroke = { ...horizontal, cell: 1 };
    expect(strokeAt([horizontal, other], { x: 100, y: 100 }, paged, 12, 0)).toBe(0);
    expect(strokeAt([horizontal, other], { x: 100, y: 100 }, paged, 12, 1)).toBe(1);
  });
});
