import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, LayoutTemplate, Pencil, Play } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { sortFields } from '@/lib/domain/field-rules';
import { canStudy, getDeckStatus, isModeBroken } from '@/lib/domain/deck-rules';
import type { Deck, Flashcard, Language } from '@/lib/types';
import { CardSummary } from './card-summary';
import { DeckStatusView } from './deck-status-view';
import { useDeckRecord } from './use-deck-record';
import { useStudyLauncher } from './use-study-launcher';

const PREVIEW = 10;

/** M03 · Detalle de un mazo: resumen, modos de recorrida y flashcards. */
export function DeckDetailPage() {
  const { id } = useParams();
  const record = useDeckRecord(id);
  if (record.status !== 'ready' || !record.deck) {
    return <DeckStatusView record={record.status === 'ready' ? { status: 'notfound' } : record} title="Mazo" />;
  }
  return <DeckDetail deck={record.deck} language={record.language} flashcards={record.flashcards} />;
}

function DeckDetail({ deck, language, flashcards }: { deck: Deck; language: Language; flashcards: Flashcard[] }) {
  const [expanded, setExpanded] = useState(false);
  const { start, dialog } = useStudyLauncher(language);
  const status = getDeckStatus(deck, language);
  const cards = deck.cardIds.map((id) => flashcards.find((c) => c.id === id)).filter((c): c is Flashcard => Boolean(c));
  const shown = expanded ? cards : cards.slice(0, PREVIEW);
  const secondaryId = sortFields(language.fields).find((f) => !f.system && f.type === 'text')?.id;

  return (
    <>
      <TopBar
        title={deck.name}
        backTo="/mazos"
        backLabel="Volver a Mazos"
        actions={
          <>
            <Link className="btn btn-secondary only-desktop" to={`/mazos/${deck.id}/editar`}><Pencil className="ic" aria-hidden="true" />Editar</Link>
            <Link className="icon-btn only-mobile" to={`/mazos/${deck.id}/editar`} aria-label="Editar mazo"><Pencil className="ic" aria-hidden="true" /></Link>
          </>
        }
      />
      <div className="page narrow" style={{ '--w': '860px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': 'var(--sp-5)' } as React.CSSProperties}>
          <section className="card" aria-label="Resumen del mazo">
            <div className="kv">
              <span className="muted">Flashcards</span><strong>{cards.length}</strong>
              <span className="muted">Idioma</span><strong>{language.name}</strong>
              <span className="muted">Forma de aprendizaje</span><strong>Libre</strong>
            </div>
            <div className="sep" />
            <h2 className="card-title" style={{ fontSize: 16 }}>Modos de recorrida</h2>
            <ul className="tags" style={{ listStyle: 'none', padding: 0 }}>
              {deck.modes.map((m) => (
                <li key={m.id} className="chip" style={isModeBroken(m, language) ? { background: 'var(--warn-soft)' } : undefined}>
                  <LayoutTemplate className="ic sm" aria-hidden="true" />{m.name}
                </li>
              ))}
            </ul>
            {status.kind === 'broken' && (
              <div style={{ marginTop: 'var(--sp-4)' }}>
                <Alert tone="warn">
                  <span>
                    <strong>Este mazo no está disponible:</strong> {status.modes.length === 1 ? `el modo «${status.modes[0].name}» usa` : 'algunos modos usan'} un layout que fue eliminado.{' '}
                    <Link to={`/mazos/${deck.id}/editar`} style={{ fontWeight: 600, textDecoration: 'underline' }}>Edítalo para elegir otro layout</Link>.
                  </span>
                </Alert>
              </div>
            )}
            {status.kind === 'empty' && (
              <div style={{ marginTop: 'var(--sp-4)' }}>
                <Alert tone="warn">Este mazo no tiene flashcards. Agrégalas desde Editar para poder estudiarlo.</Alert>
              </div>
            )}
            <Button large block style={{ marginTop: 'var(--sp-5)' }} disabled={!canStudy(status)} onClick={() => start(deck)}>
              <Play className="ic" aria-hidden="true" />Estudiar este mazo
            </Button>
          </section>

          <section aria-labelledby="l-t">
            <div className="row" style={{ marginBottom: 'var(--sp-3)' }}>
              <h2 id="l-t" className="grow">Flashcards del mazo</h2>
              <span className="small muted">{cards.length}</span>
            </div>
            {cards.length === 0 ? (
              <p className="muted">Todavía no hay flashcards en este mazo.</p>
            ) : (
              <ul className="list" style={{ listStyle: 'none', padding: 0 }}>
                {shown.map((c) => (
                  <li key={c.id}>
                    <Link className="item" to={`/flashcards/${c.id}`}>
                      <CardSummary card={c} language={language} secondaryId={secondaryId} />
                      <ChevronRight className="ic" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {cards.length > PREVIEW && (
              <Button variant="ghost" block style={{ marginTop: 'var(--sp-2)' }} onClick={() => setExpanded((v) => !v)}>
                {expanded ? 'Ver menos' : `Ver las ${cards.length} flashcards`}
              </Button>
            )}
          </section>
        </div>
      </div>
      {dialog}
    </>
  );
}
