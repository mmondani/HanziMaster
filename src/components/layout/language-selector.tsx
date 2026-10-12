import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown } from 'lucide-react';
import { languageGlyph } from '@/lib/domain/language-presentation';
import { useLanguages } from '@/lib/languages/languages-provider';
import type { Language } from '@/lib/types';

const ITEMS = '[role="menuitemradio"],[role="menuitem"]';

/** Chip con el idioma activo; abre un menú para cambiarlo y acceder a "Administrar idiomas". */
export function LanguageSelector({ onSelect }: { onSelect?: (language: Language) => void }) {
  const { languages, active, setActiveId } = useLanguages();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const menu = root.current?.querySelector<HTMLElement>('[role="menu"]');
    (menu?.querySelector<HTMLElement>('[aria-checked="true"]') ?? menu?.querySelector<HTMLElement>(ITEMS))?.focus();
    const onPointerDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  if (!languages || !active) return null;

  function close(refocus: boolean) {
    setOpen(false);
    if (refocus) button.current?.focus();
  }

  function onMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
    if (e.key === 'Tab') { setOpen(false); return; }
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(ITEMS));
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  }

  return (
    <div className="anchor" ref={root}>
      <button
        ref={button}
        type="button"
        className="lang-chip"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Idioma: ${active.name}. Cambiar idioma`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flag han" lang={active.code} aria-hidden="true">{languageGlyph(active)}</span>
        {active.name}
        <ChevronDown className="ic sm" aria-hidden="true" />
      </button>
      {open && (
        <div className="popover" role="menu" tabIndex={-1} aria-label="Idioma" onKeyDown={onMenuKeyDown}>
          {languages.map((l) => (
            <button
              key={l.id}
              type="button"
              role="menuitemradio"
              aria-checked={l.id === active.id}
              className="opt-row"
              onClick={() => { setActiveId(l.id); onSelect?.(l); close(true); }}
            >
              <span className="grow">{l.name}</span>
              {l.id === active.id && <Check className="ic sm" aria-hidden="true" />}
            </button>
          ))}
          <Link role="menuitem" className="opt-row" to="/idiomas" onClick={() => setOpen(false)} style={{ borderTop: '1px solid var(--border)', borderRadius: 0 }}>
            Administrar idiomas
          </Link>
        </div>
      )}
    </div>
  );
}
