import { useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from 'react';

export const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE_PX = 10;

/**
 * Pulsación larga solo con touch o lápiz (con mouse no se activa). Se cancela si se suelta antes de tiempo,
 * si el dedo se mueve (scroll) o si el navegador cancela el gesto. Devuelve props para esparcir en el elemento:
 * tras una pulsación larga, `onClick` anula el clic que la sigue (p. ej. la navegación de un enlace).
 */
export function useLongPress(onLongPress: (() => void) | undefined) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const origin = useRef({ x: 0, y: 0 });
  const fired = useRef(false);
  const callback = useRef(onLongPress);
  useEffect(() => { callback.current = onLongPress; });

  const cancel = useCallback(() => { clearTimeout(timer.current); timer.current = undefined; }, []);
  useEffect(() => cancel, [cancel]);

  if (!onLongPress) return {};
  return {
    onPointerDown(e: PointerEvent) {
      if (e.pointerType === 'mouse') return;
      fired.current = false;
      origin.current = { x: e.clientX, y: e.clientY };
      cancel();
      timer.current = setTimeout(() => {
        timer.current = undefined;
        fired.current = true;
        navigator.vibrate?.(10);
        callback.current?.();
      }, LONG_PRESS_MS);
    },
    onPointerMove(e: PointerEvent) {
      if (timer.current === undefined) return;
      if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > MOVE_TOLERANCE_PX) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    // Android abre el menú contextual con la pulsación larga.
    onContextMenu(e: MouseEvent) { if (fired.current || timer.current !== undefined) e.preventDefault(); },
    onClick(e: MouseEvent) {
      if (!fired.current) return;
      fired.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };
}
