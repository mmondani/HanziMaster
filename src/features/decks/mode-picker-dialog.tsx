import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { describeMode } from '@/lib/domain/deck-rules';
import type { Deck, Language } from '@/lib/types';

const lastModeKey = (deckId: string) => `hm:last-mode:${deckId}`;

export const studyPath = (deckId: string, modeId: string) => `/mazos/${deckId}/estudiar?modo=${modeId}`;

function readLastMode(deck: Deck): string {
  try {
    const stored = localStorage.getItem(lastModeKey(deck.id));
    if (stored && deck.modes.some((m) => m.id === stored)) return stored;
  } catch { /* sin almacenamiento: se usa el primer modo */ }
  return deck.modes[0].id;
}

export function rememberMode(deckId: string, modeId: string) {
  try { localStorage.setItem(lastModeKey(deckId), modeId); } catch { /* no se recuerda */ }
}

export interface ModePickerDialogProps {
  deck: Deck;
  language: Language;
  onClose: () => void;
}

/** M04 · Elegir con qué modo de recorrida estudiar un mazo (el último usado viene preseleccionado). */
export function ModePickerDialog({ deck, language, onClose }: ModePickerDialogProps) {
  const navigate = useNavigate();
  const [modeId, setModeId] = useState(() => readLastMode(deck));

  function start() {
    rememberMode(deck.id, modeId);
    navigate(studyPath(deck.id, modeId));
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); start(); }
  }

  return (
    <Dialog
      open
      title={`${deck.name} · ¿Cómo recorrerlo?`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={start}><Play className="ic" aria-hidden="true" />Comenzar</Button>
        </>
      }
    >
      <div className="stack" style={{ '--gap': 'var(--sp-2)' } as React.CSSProperties} role="radiogroup" aria-label="Modo de recorrida">
        {deck.modes.map((m) => (
          // eslint-disable-next-line jsx-a11y/label-has-associated-control -- el texto está anidado a más de 2 niveles; el control se asocia con htmlFor
          <label key={m.id} htmlFor={`mode-${m.id}`} className="item hover" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
            <input
              id={`mode-${m.id}`}
              type="radio"
              name="modo"
              value={m.id}
              checked={m.id === modeId}
              data-autofocus={m.id === modeId ? '' : undefined}
              onChange={() => setModeId(m.id)}
              onKeyDown={onKeyDown}
              style={{ width: 22, height: 22, accentColor: 'var(--primary)', marginTop: 2 }}
            />
            <span className="meta">
              <span className="t" style={{ whiteSpace: 'normal' }}>{m.name}</span>
              <span className="s" style={{ whiteSpace: 'normal' }}>{describeMode(m, language)}</span>
            </span>
          </label>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 'var(--sp-3)' }}>
        Forma de aprendizaje: <strong style={{ color: 'var(--text)' }}>Libre</strong> · orden aleatorio, sin registrar aciertos.
      </p>
    </Dialog>
  );
}
