import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Ellipsis } from 'lucide-react';
import { IconButton } from './icon-button';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  /** Navega a una ruta (se muestra como enlace). */
  to?: string;
  /** Ejecuta una acción (se muestra como botón). */
  onSelect?: () => void;
}

const ITEMS = '[role="menuitem"]';

/** Menú desplegable de acciones secundarias (botón ⋯). Esc cierra, ↑↓ mueven el foco. */
export function Menu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>(ITEMS)?.focus();
    const onPointerDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); trigger.current?.focus(); return; }
    if (e.key === 'Tab') { setOpen(false); return; }
    const nodes = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(ITEMS));
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); nodes[(i + 1) % nodes.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); nodes[(i - 1 + nodes.length) % nodes.length].focus(); }
  }

  return (
    <div className="anchor" ref={root}>
      <IconButton ref={trigger} aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Ellipsis className="ic" aria-hidden="true" />
      </IconButton>
      {open && (
        <div className="popover" role="menu" tabIndex={-1} aria-label={label} style={{ left: 'auto', right: 0 }} onKeyDown={onKeyDown}>
          {items.map((item) =>
            item.to ? (
              <Link key={item.label} role="menuitem" className="opt-row" to={item.to} onClick={() => setOpen(false)}>{item.icon}{item.label}</Link>
            ) : (
              <button key={item.label} type="button" role="menuitem" className="opt-row" onClick={() => { setOpen(false); item.onSelect?.(); }}>
                {item.icon}{item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
