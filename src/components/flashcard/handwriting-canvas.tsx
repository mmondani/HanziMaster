import { useEffect, useMemo, useReducer, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronLeft, ChevronRight, CircleCheck, CircleX, Eraser, Info, SpellCheck, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { describeVerdict, drawableChars, handwritingOutcome, type CharVerdict } from '@/lib/domain/handwriting';
import { judgeCharacter } from '@/lib/domain/stroke-matching';
import { cellGrid, cellOf, drawingReducer, initialDrawing, strokeAt, strokesOfCell, toCellUnits, type Point } from '@/lib/domain/strokes';
import type { CharData } from '@/lib/handwriting/char-data';
import { useCharDataLoader } from '@/lib/handwriting/char-data-provider';
import { useElementSize } from '@/lib/hooks/use-element-size';
import { useHorizontalSwipe } from '@/lib/hooks/use-horizontal-swipe';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import type { Language } from '@/lib/types';
import { inkWidth, paintDrawing, paintSegment, readColors, type PaintColors } from './handwriting-paint';

/** En pantallas angostas se dibuja un carácter a la vez, en la celda más grande posible. */
const PAGED_QUERY = '(max-width: 639.98px)';
/** Hasta cuántos píxeles se puede mover el dedo para que cuente como toque (borra un trazo) y no como trazo. */
const TAP_SLOP = 8;
/** Margen alrededor del trazo, además de su grosor, para acertarle con el dedo. */
const TAP_MARGIN = 12;

const VERDICT_LABEL: Record<CharVerdict['kind'], string> = { ok: 'correcto', error: 'con errores', unavailable: 'no se puede validar' };
const VERDICT_CLASS: Record<CharVerdict['kind'], string> = { ok: ' is-ok', error: ' is-err', unavailable: ' is-na' };

export interface HandwritingCanvasProps {
  language: Pick<Language, 'code'>;
  /** Palabra contra la que se valida (campo Palabra). */
  word: string;
}

/**
 * Layout Dibujar: un único canvas con una celda por carácter de la palabra, para escribir a mano alzada.
 * En mobile se ve una celda a la vez y se cambia de carácter con los indicadores o las flechas.
 * Deshacer quita el último trazo, Borrar limpia todo y Validar compara cada celda con los trazos del carácter
 * (sin importar orden ni dirección) y marca el resultado sobre el dibujo.
 */
export function HandwritingCanvas({ language, word }: HandwritingCanvasProps) {
  const chars = useMemo(() => drawableChars(word), [word]);
  const paged = useMediaQuery(PAGED_QUERY);
  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const area = useElementSize(areaRef);
  const grid = useMemo(
    () => cellGrid(chars.length, area.width, { paged, height: area.height }),
    [chars.length, area.width, area.height, paged],
  );
  const [drawing, dispatch] = useReducer(drawingReducer, initialDrawing);
  const [charData, setCharData] = useState<(CharData | null)[]>([]);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [current, setCurrent] = useState(0);
  /** Trazo en curso. Hasta que el dedo se mueve más de `TAP_SLOP` es un toque y no se pinta. */
  const live = useRef<{ id: number; points: Point[]; colors: PaintColors; moved: boolean } | null>(null);
  const loader = useCharDataLoader();
  // Swipe sobre la tira de indicadores: a la izquierda, el carácter siguiente; a la derecha, el anterior.
  const swipe = useHorizontalSwipe(
    () => setCurrent((c) => Math.min(c + 1, chars.length - 1)),
    () => setCurrent((c) => Math.max(c - 1, 0)),
  );

  // Se repinta todo al cambiar el tamaño, el dibujo, el resultado o el carácter visible.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(grid.width * dpr);
    canvas.height = Math.round(grid.height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintDrawing(ctx, grid, drawing.strokes, drawing.verdicts, charData, readColors(canvas), paged ? current : undefined);
  }, [grid, drawing, charData, paged, current]);

  function pointOf(e: { clientX: number; clientY: number }): Point {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (live.current || e.button > 0 || grid.cells.length === 0) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Sin soporte de captura: el trazo igual termina en pointerup.
    }
    live.current = { id: e.pointerId, points: [pointOf(e)], colors: readColors(e.currentTarget), moved: false };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    const stroke = live.current;
    if (!stroke || stroke.id !== e.pointerId) return;
    const ctx = e.currentTarget.getContext('2d');
    const width = inkWidth(grid.cells[0]);
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const ev of events.length > 0 ? events : [e]) {
      const point = pointOf(ev);
      const prev = stroke.points[stroke.points.length - 1];
      stroke.points.push(point);
      if (stroke.moved) {
        if (ctx) paintSegment(ctx, prev, point, width, stroke.colors.ink);
      } else if (Math.hypot(point.x - stroke.points[0].x, point.y - stroke.points[0].y) > TAP_SLOP) {
        // Dejó de ser un toque: se pinta lo recorrido hasta ahora.
        stroke.moved = true;
        if (ctx) stroke.points.slice(1).forEach((p, i) => paintSegment(ctx, stroke.points[i], p, width, stroke.colors.ink));
      }
    }
  }

  function onPointerEnd(e: ReactPointerEvent<HTMLCanvasElement>) {
    const stroke = live.current;
    if (!stroke || stroke.id !== e.pointerId) return;
    live.current = null;
    if (!stroke.moved) {
      // Un toque sobre un trazo lo borra; en otro lugar (o si el sistema canceló el gesto) no hace nada.
      if (e.type === 'pointercancel') return;
      const tolerance = inkWidth(grid.cells[0]) / 2 + TAP_MARGIN;
      const touched = strokeAt(drawing.strokes, stroke.points[0], grid.cells, tolerance, paged ? current : undefined);
      if (touched >= 0) dispatch({ type: 'remove', index: touched });
      return;
    }
    const index = paged ? current : cellOf(stroke.points, grid.cells);
    const cell = grid.cells[index];
    dispatch({ type: 'add', stroke: { cell: index, points: stroke.points.map((p) => toCellUnits(p, cell)) } });
  }

  async function validate() {
    const strokes = drawing.strokes;
    setChecking(true);
    setFailed(false);
    try {
      const data = await Promise.all(chars.map((ch) => loader.load(ch, language)));
      setCharData(data);
      const verdicts = data.map((d, i) => judgeCharacter(strokesOfCell(strokes, i).map((s) => s.points), d?.medians ?? null));
      dispatch({ type: 'validated', verdicts, strokes });
      // En mobile se muestra el primer carácter con errores, si el visible no tiene.
      const firstError = verdicts.findIndex((v) => v.kind === 'error');
      if (paged && firstError >= 0 && verdicts[current].kind !== 'error') setCurrent(firstError);
    } catch {
      setFailed(true);
    } finally {
      setChecking(false);
    }
  }

  if (chars.length === 0) {
    return <p className="hw-empty muted">Esta flashcard no tiene caracteres para dibujar.</p>;
  }

  const verdicts = drawing.verdicts;
  const outcome = verdicts && handwritingOutcome(verdicts);
  const hasStrokes = drawing.strokes.length > 0;
  const canUndo = paged ? strokesOfCell(drawing.strokes, current).length > 0 : hasStrokes;
  const byChar = verdicts?.map((v, i) => ({ v, i })) ?? [];
  const errors = byChar.filter(({ v }) => v.kind === 'error');
  const unverifiable = byChar.filter(({ v }) => v.kind === 'unavailable');
  const pages = paged && chars.length > 1;

  function pageState(i: number) {
    const verdict = verdicts?.[i];
    if (verdict) return { label: `, ${VERDICT_LABEL[verdict.kind]}`, className: VERDICT_CLASS[verdict.kind] };
    return strokesOfCell(drawing.strokes, i).length > 0 ? { label: ', con trazos', className: ' is-drawn' } : { label: '', className: '' };
  }

  return (
    // Dentro del área de dibujo la carta no se gira ni se navega con swipe.
    <div className={`hw${paged ? ' is-paged' : ''}`} data-no-flip data-no-swipe>
      {pages && (
        <div className="hw-nav" {...swipe}>
          <IconButton aria-label="Carácter anterior" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
            <ChevronLeft className="ic" aria-hidden="true" />
          </IconButton>
          <div className="hw-pages" role="group" aria-label="Caracteres">
            {chars.map((_, i) => {
              const state = pageState(i);
              return (
                <button
                  key={i}
                  type="button"
                  className={`hw-page${state.className}`}
                  aria-current={i === current ? 'true' : undefined}
                  aria-label={`Carácter ${i + 1} de ${chars.length}${state.label}`}
                  onClick={() => setCurrent(i)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <IconButton aria-label="Carácter siguiente" disabled={current === chars.length - 1} onClick={() => setCurrent(current + 1)}>
            <ChevronRight className="ic" aria-hidden="true" />
          </IconButton>
        </div>
      )}
      <div className="hw-area" ref={areaRef}>
        <canvas
          ref={canvasRef}
          className="hw-canvas"
          style={{ width: grid.width, height: grid.height }}
          role="img"
          aria-label={`Área de dibujo: ${
            pages ? `carácter ${current + 1} de ${chars.length}` : chars.length === 1 ? 'una celda' : `${chars.length} celdas, una por carácter`
          }`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        />
      </div>
      <div className="hw-tools">
        <IconButton
          aria-label="Deshacer trazo"
          title="Deshacer trazo"
          disabled={!canUndo}
          onClick={() => dispatch({ type: 'undo', cell: paged ? current : undefined })}
        >
          <Undo2 className="ic" aria-hidden="true" />
        </IconButton>
        <IconButton aria-label="Borrar todo" title="Borrar todo" disabled={!hasStrokes} onClick={() => dispatch({ type: 'clear' })}>
          <Eraser className="ic" aria-hidden="true" />
        </IconButton>
        <Button onClick={() => void validate()} disabled={!hasStrokes} loading={checking}>
          <SpellCheck className="ic" aria-hidden="true" />Validar
        </Button>
      </div>
      {failed && <p className="hw-msg err" role="alert">No se pudieron descargar los trazos. Revisá la conexión y volvé a intentar.</p>}
      {outcome && (
        <div className={`hw-result ${outcome}`} role="status">
          {outcome === 'correct' && <p><CircleCheck className="ic" aria-hidden="true" />¡Correcto!</p>}
          {outcome === 'errors' && <p><CircleX className="ic" aria-hidden="true" />Hay errores: están marcados en rojo.</p>}
          {outcome === 'unverifiable' && <p><Info className="ic" aria-hidden="true" />No hay datos de trazos para validar esta palabra.</p>}
          {outcome !== 'unverifiable' && unverifiable.length > 0 && (
            <ul>
              {unverifiable.map(({ v, i }) => (
                <li key={i}>{chars.length > 1 && `Carácter ${i + 1}: `}{describeVerdict(v)}</li>
              ))}
            </ul>
          )}
          {/* Los errores se ven marcados en el dibujo; el detalle en texto queda solo para lectores de pantalla. */}
          {errors.length > 0 && (
            <ul className="sr-only">
              {errors.map(({ v, i }) => (
                <li key={i}>{chars.length > 1 && `Carácter ${i + 1}: `}{describeVerdict(v)}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
