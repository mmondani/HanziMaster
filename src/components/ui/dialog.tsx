import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './icon-button';

export interface DialogProps {
  open: boolean;
  title: string;
  /** Se invoca con Esc, clic en el fondo o la ✕. */
  onClose: () => void;
  children: ReactNode;
  /** Botones del pie (el último suele ser la acción principal). */
  footer?: ReactNode;
  /** `alertdialog` para confirmaciones destructivas; no muestra ✕. */
  role?: 'dialog' | 'alertdialog';
  /** Si es false no se cierra con Esc ni con el fondo (ej. fin del mazo). */
  dismissible?: boolean;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Diálogo modal. En mobile se muestra como hoja inferior y en desktop centrado (solo CSS).
 * Atrapa el foco, cierra con Esc, bloquea el scroll del fondo y devuelve el foco al cerrar.
 * El elemento con `data-autofocus` recibe el foco inicial.
 */
export function Dialog({ open, title, onClose, children, footer, role = 'dialog', dismissible = true }: DialogProps) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const sheet = sheetRef.current!;
    const autofocus = sheet.querySelector<HTMLElement>('[data-autofocus]');
    (autofocus ?? sheet.querySelector<HTMLElement>(FOCUSABLE) ?? sheet).focus();
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (dismissible) onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [open, dismissible]);

  if (!open) return null;
  return createPortal(
    <div className="overlay open" role="presentation" onMouseDown={(e) => { if (dismissible && e.target === e.currentTarget) onClose(); }}>
      <div ref={sheetRef} className="sheet" role={role} aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="sheet-grab" />
        <div className="sheet-head">
          <h2 id={titleId}>{title}</h2>
          {dismissible && role === 'dialog' && (
            <IconButton aria-label="Cerrar" onClick={onClose}><X className="ic" aria-hidden="true" /></IconButton>
          )}
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
