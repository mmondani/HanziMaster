import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Deck, Language } from '@/lib/types';
import { ModePickerDialog, rememberMode, studyPath } from './mode-picker-dialog';

/**
 * Inicia el recorrido de un mazo: con un único modo arranca directo; con varios abre el selector (M04).
 * Devuelve `start` y el diálogo que hay que renderizar.
 */
export function useStudyLauncher(language: Language | undefined): { start: (deck: Deck) => void; dialog: ReactNode } {
  const navigate = useNavigate();
  const [pending, setPending] = useState<Deck | null>(null);

  function start(deck: Deck) {
    if (deck.modes.length === 1) {
      rememberMode(deck.id, deck.modes[0].id);
      navigate(studyPath(deck.id, deck.modes[0].id));
    } else {
      setPending(deck);
    }
  }

  const dialog = pending && language ? <ModePickerDialog deck={pending} language={language} onClose={() => setPending(null)} /> : null;
  return { start, dialog };
}
