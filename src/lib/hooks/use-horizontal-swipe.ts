import { useRef, type MouseEvent, type PointerEvent } from 'react';

/** Distancia horizontal mínima (px) para que el gesto cuente como swipe. */
const SWIPE_MIN = 40;

/**
 * Swipe horizontal sobre un elemento con Pointer Events: a la izquierda llama a `onLeft` y a la derecha a `onRight`.
 * Tiene que ser más horizontal que vertical. El click que el navegador dispara al terminar un swipe se descarta,
 * para no activar el botón donde empezó el gesto.
 */
export function useHorizontalSwipe(onLeft: () => void, onRight: () => void) {
  const start = useRef<{ id: number; x: number; y: number } | null>(null);
  const swiped = useRef(false);
  return {
    onPointerDown: (e: PointerEvent) => {
      start.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
      swiped.current = false;
    },
    onPointerUp: (e: PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s || s.id !== e.pointerId) return;
      const dx = e.clientX - s.x;
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(e.clientY - s.y)) return;
      swiped.current = true;
      if (dx < 0) onLeft();
      else onRight();
    },
    onPointerCancel: () => {
      start.current = null;
    },
    onClickCapture: (e: MouseEvent) => {
      if (!swiped.current) return;
      swiped.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };
}
