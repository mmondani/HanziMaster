import { useEffect, useReducer, useRef, useState, type TouchEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CircleCheck, FlipHorizontal2, Shuffle, X } from 'lucide-react';
import { FlashcardView } from '@/components/flashcard/flashcard-view';
import { FlipCard } from '@/components/flashcard/flip-card';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { IconButton } from '@/components/ui/icon-button';
import { DeckStatusView } from '@/features/decks/deck-status-view';
import { useDeckRecord } from '@/features/decks/use-deck-record';
import { getDeckStatus } from '@/lib/domain/deck-rules';
import { reshuffle, shuffle } from '@/lib/domain/shuffle';
import { initStudy, studyReducer } from '@/lib/domain/study-session';
import type { Deck, Flashcard, Language, TraversalMode } from '@/lib/types';

/** Distancia horizontal mínima (px) para que un gesto cuente como swipe. */
const SWIPE_THRESHOLD = 60;

/** R01–R03 · Recorrido de un mazo en pantalla completa: `/mazos/:id/estudiar?modo=<id>`. */
export function StudyPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const record = useDeckRecord(id);
  if (record.status !== 'ready' || !record.deck) {
    return <DeckStatusView record={record.status === 'ready' ? { status: 'notfound' } : record} title="Recorrido" />;
  }
  const { deck, language, flashcards } = record;
  const mode = deck.modes.find((m) => m.id === params.get('modo'));
  const status = getDeckStatus(deck, language);

  if (status.kind !== 'ok' || !mode) {
    return (
      <main className="center-screen">
        <div className="login-card">
          <Alert tone="warn">
            {status.kind === 'broken' && 'Este mazo no está disponible: uno de sus modos usa un layout que fue eliminado.'}
            {status.kind === 'empty' && 'Este mazo no tiene flashcards.'}
            {status.kind === 'ok' && !mode && 'No se encontró el modo de recorrida elegido.'}
          </Alert>
          <Link className="btn btn-primary" to={`/mazos/${deck.id}`}>Volver al mazo</Link>
        </div>
      </main>
    );
  }
  return <Study key={`${deck.id}:${mode.id}`} deck={deck} language={language} mode={mode} flashcards={flashcards} />;
}

interface StudyProps {
  deck: Deck;
  language: Language;
  mode: TraversalMode;
  flashcards: Flashcard[];
}

function Study({ deck, language, mode, flashcards }: StudyProps) {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(studyReducer, deck.cardIds, (ids) => initStudy(shuffle(ids.filter((id) => flashcards.some((c) => c.id === id)))));
  const [confirmingExit, setConfirmingExit] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const total = state.order.length;
  const card = flashcards.find((c) => c.id === state.order[state.index]);
  const front = language.layouts.find((l) => l.id === mode.frontLayoutId);
  const back = language.layouts.find((l) => l.id === mode.backLayoutId);
  const dialogOpen = confirmingExit || state.finished;

  // Teclado: ← → navegan, Espacio/Enter giran (si nada tiene el foco), Esc pide salir.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (dialogOpen) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); dispatch({ type: 'next' }); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); dispatch({ type: 'prev' }); }
      else if ((e.key === ' ' || e.key === 'Enter') && e.target === document.body) { e.preventDefault(); dispatch({ type: 'flip' }); }
      else if (e.key === 'Escape') setConfirmingExit(true);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [dialogOpen]);

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || dialogOpen) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) dispatch({ type: dx < 0 ? 'next' : 'prev' });
  }

  if (!card || !front || !back) {
    return (
      <main className="center-screen">
        <div className="login-card"><Alert tone="warn">No hay flashcards para recorrer.</Alert><Link className="btn btn-primary" to={`/mazos/${deck.id}`}>Volver al mazo</Link></div>
      </main>
    );
  }

  return (
    <div className="study">
      <header className="study-top">
        <IconButton aria-label="Salir del recorrido" onClick={() => setConfirmingExit(true)}><X className="ic" aria-hidden="true" /></IconButton>
        <div className="grow">
          <h1 style={{ fontSize: 16, fontWeight: 600 }}>{deck.name}</h1>
          <div className="xs muted">{mode.name} · Libre</div>
        </div>
        <div className="small" style={{ fontWeight: 600, minWidth: 64, textAlign: 'right' }} role="status" aria-live="polite">
          {state.index + 1} / {total}
        </div>
      </header>
      <div style={{ padding: '0 var(--sp-4)' }}>
        <div className="progress" role="progressbar" aria-label="Progreso del recorrido" aria-valuemin={0} aria-valuemax={total} aria-valuenow={state.index + 1}>
          <i style={{ width: `${((state.index + 1) / total) * 100}%` }} />
        </div>
      </div>

      <main className="study-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <FlipCard
          key={`${state.order.join()}:${state.index}`}
          flipped={state.flipped}
          onFlipChange={() => dispatch({ type: 'flip' })}
          front={<FlashcardView language={language} card={card} layout={front} />}
          back={<FlashcardView language={language} card={card} layout={back} />}
        />
      </main>

      <footer>
        <p className="hint" style={{ marginBottom: 'var(--sp-2)' }}>
          <span className="only-mobile">Toca la carta para girarla · desliza para avanzar</span>
          <span className="only-desktop">Clic o Espacio para girar · ← → para navegar · Esc para salir</span>
        </p>
        <div className="study-ctrl">
          <button type="button" className="nav-btn" aria-label="Carta anterior" disabled={state.index === 0} onClick={() => dispatch({ type: 'prev' })}>
            <ArrowLeft className="ic lg" aria-hidden="true" />
          </button>
          <Button variant="secondary" onClick={() => dispatch({ type: 'flip' })}><FlipHorizontal2 className="ic" aria-hidden="true" />Girar</Button>
          <button type="button" className="nav-btn" aria-label="Carta siguiente" onClick={() => dispatch({ type: 'next' })}>
            <ArrowRight className="ic lg" aria-hidden="true" />
          </button>
        </div>
      </footer>

      {confirmingExit && (
        <Dialog
          open
          role="alertdialog"
          title="¿Salir del recorrido?"
          onClose={() => setConfirmingExit(false)}
          footer={
            <>
              <Button variant="secondary" data-autofocus onClick={() => setConfirmingExit(false)}>Seguir estudiando</Button>
              <Button onClick={() => navigate('/mazos')}>Salir</Button>
            </>
          }
        >
          <p className="muted">No se guarda el avance: la próxima vez el mazo se vuelve a mezclar.</p>
        </Dialog>
      )}

      {state.finished && (
        <Dialog
          open
          dismissible={false}
          title="¡Terminaste el mazo!"
          onClose={() => undefined}
          footer={
            <>
              <Button variant="secondary" onClick={() => navigate('/mazos')}>Salir</Button>
              <Button data-autofocus onClick={() => dispatch({ type: 'restart', order: reshuffle(state.order, state.order) })}>
                <Shuffle className="ic" aria-hidden="true" />Volver a mezclar
              </Button>
            </>
          }
        >
          <div className="empty" style={{ padding: 'var(--sp-3) 0' }}>
            <div className="art" style={{ background: 'var(--success-soft)', color: 'var(--success)' }} aria-hidden="true"><CircleCheck className="ic lg" /></div>
            <p>Recorriste {total === 1 ? 'la flashcard' : `las ${total} flashcards`} de «{deck.name}».</p>
          </div>
        </Dialog>
      )}
    </div>
  );
}
