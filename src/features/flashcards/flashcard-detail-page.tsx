import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { FlashcardView } from '@/components/flashcard/flashcard-view';
import { FlipCard } from '@/components/flashcard/flip-card';
import { TtsButton } from '@/components/flashcard/tts-button';
import { TopBar } from '@/components/layout/top-bar';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Segmented } from '@/components/ui/segmented';
import { useDecks } from '@/lib/decks/decks-provider';
import { sortFields } from '@/lib/domain/field-rules';
import { isCjk, isTargetLanguageField } from '@/lib/domain/flashcard-form';
import type { Flashcard, Language } from '@/lib/types';
import { DeleteFlashcardDialog } from './delete-flashcard-dialog';
import { RecordStatusView } from './record-status-view';
import { useDeleteFlashcard } from './use-delete-flashcard';
import { useFlashcardRecord } from './use-flashcard-record';

/** F04 · Detalle de una flashcard: vista previa con giro, campos y mazos donde aparece. */
export function FlashcardDetailPage() {
  const { id } = useParams();
  const record = useFlashcardRecord(id);
  if (record.status !== 'ready' || !record.card) {
    return <RecordStatusView record={record.status === 'ready' ? { status: 'notfound' } : record} title="Flashcard" />;
  }
  return <FlashcardDetail language={record.language} card={record.card} />;
}

const LABEL_STYLE = { fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' } as const;

function FlashcardDetail({ language, card }: { language: Language; card: Flashcard }) {
  const { decks } = useDecks();
  const deleteFlashcard = useDeleteFlashcard();
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const inDecks = (decks ?? []).filter((d) => d.cardIds.includes(card.id));
  const layouts = language.layouts;
  const front = layouts.find((l) => l.id === layoutId) ?? layouts[0];
  // El reverso de la vista previa es el siguiente layout distinto; con uno solo, el mismo.
  const back = front ? layouts.find((l) => l.id !== front.id) ?? front : undefined;
  const cjk = isCjk(language);

  async function confirmDelete() {
    setBusy(true);
    try {
      await deleteFlashcard(card.id);
    } catch {
      setBusy(false);
      setConfirming(false);
      setFailed(true);
    }
  }

  return (
    <>
      <TopBar
        title="Flashcard"
        backTo="/flashcards"
        backLabel="Volver a Flashcards"
        actions={
          <>
            <Link className="btn btn-secondary only-desktop" to={`/flashcards/${card.id}/editar`}><Pencil className="ic" aria-hidden="true" />Editar</Link>
            <Button variant="danger-ghost" className="only-desktop" onClick={() => setConfirming(true)}><Trash2 className="ic" aria-hidden="true" />Eliminar</Button>
            <Link className="icon-btn only-mobile" to={`/flashcards/${card.id}/editar`} aria-label="Editar"><Pencil className="ic" aria-hidden="true" /></Link>
            <IconButton className="only-mobile" aria-label="Eliminar" style={{ color: 'var(--danger)' }} onClick={() => setConfirming(true)}><Trash2 className="ic" aria-hidden="true" /></IconButton>
          </>
        }
      />
      <div className="page">
        {failed && <div style={{ marginBottom: 'var(--sp-4)' }}><Alert tone="err">No se pudo eliminar la flashcard. Inténtalo de nuevo.</Alert></div>}
        <div className="split two-one">
          <section aria-labelledby="prev-t" className="stack" style={{ '--gap': 'var(--sp-3)' } as React.CSSProperties}>
            <div className="row">
              <h2 id="prev-t" className="grow">Vista previa</h2>
              {layouts.length > 1 && (
                <Segmented label="Layout de vista previa" options={layouts.map((l) => ({ value: l.id, label: l.name }))} value={front.id} onChange={setLayoutId} />
              )}
            </div>
            {front && back ? (
              <>
                <FlipCard
                  style={{ maxWidth: 'none', aspectRatio: '16 / 10', maxHeight: 'none' }}
                  front={<FlashcardView language={language} card={card} layout={front} />}
                  back={<FlashcardView language={language} card={card} layout={back} />}
                />
                <p className="hint">Toca la carta para girarla</p>
              </>
            ) : (
              <Alert tone="info">
                Este idioma todavía no tiene layouts, así que no hay vista previa.{' '}
                <Link to={`/idiomas/${language.id}?tab=layouts`} style={{ fontWeight: 600, textDecoration: 'underline' }}>Crear un layout</Link>
              </Alert>
            )}
          </section>

          <section aria-labelledby="data-t" className="card">
            <h2 id="data-t" className="card-title">Campos</h2>
            <dl className="stack" style={{ '--gap': 'var(--sp-4)' } as React.CSSProperties}>
              {sortFields(language.fields).map((f) => {
                const raw = f.system === 'tags' ? card.tags : card.values[f.id];
                const text = Array.isArray(raw) ? raw.join(', ') : raw === undefined ? '' : String(raw);
                const target = isTargetLanguageField(f);
                return (
                  <div key={f.id}>
                    <dt className="xs muted" style={LABEL_STYLE}>{f.name}</dt>
                    <dd className="row" style={{ marginTop: 4 }}>
                      {f.system === 'tags' ? (
                        card.tags.length > 0
                          ? <span className="tags">{card.tags.map((t) => <span key={t} className="tag">{t}</span>)}</span>
                          : <span className="muted">Sin tags</span>
                      ) : text ? (
                        <span
                          className={`grow${target && cjk ? ' han' : ''}`}
                          lang={target ? language.code : undefined}
                          style={f.system === 'word' ? { fontSize: 28 } : undefined}
                        >
                          {text}
                        </span>
                      ) : (
                        <span className="muted grow">—</span>
                      )}
                      {f.tts && text && <TtsButton text={text} lang={language.code} label={`Escuchar ${f.name.toLowerCase()}`} />}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <div className="sep" />
            <p className="small muted">
              {inDecks.length === 0 ? 'No aparece en ningún mazo.' : `Aparece en ${inDecks.length} ${inDecks.length === 1 ? 'mazo' : 'mazos'}: `}
              {inDecks.map((d, i) => (
                <span key={d.id}>
                  {i > 0 && ', '}
                  <Link to={`/mazos/${d.id}`} style={{ color: 'var(--primary-text)', fontWeight: 600 }}>{d.name}</Link>
                </span>
              ))}
            </p>
          </section>
        </div>
      </div>
      {confirming && <DeleteFlashcardDialog deckCount={inDecks.length} busy={busy} onConfirm={() => void confirmDelete()} onClose={() => setConfirming(false)} />}
    </>
  );
}
