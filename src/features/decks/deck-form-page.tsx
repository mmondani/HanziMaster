import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast-provider';
import { UnsavedChangesGuard } from '@/components/ui/unsaved-changes-guard';
import { describeMode, hasDeckErrors, isModeBroken, validateDeck, type DeckErrors } from '@/lib/domain/deck-rules';
import { sortFields } from '@/lib/domain/field-rules';
import { languageGlyph } from '@/lib/domain/language-presentation';
import { newId } from '@/lib/ids';
import { useRepositories } from '@/lib/repositories/repositories-provider';
import type { Deck, Flashcard, Language, TraversalMode } from '@/lib/types';
import { CardSummary } from './card-summary';
import { DeckStatusView } from './deck-status-view';
import { FlashcardPickerDialog } from './flashcard-picker-dialog';
import { ModeEditorDialog } from './mode-editor-dialog';
import { useDeckRecord } from './use-deck-record';

const PREVIEW = 5;
const NO_ERRORS: DeckErrors = { modeErrors: {} };

/** M02 · Rutas `/mazos/nuevo` (acepta `?cartas=id1,id2`) y `/mazos/:id/editar`. */
export function DeckFormPage() {
  const { id } = useParams();
  const record = useDeckRecord(id);
  if (record.status !== 'ready') return <DeckStatusView record={record} title={id ? 'Editar mazo' : 'Nuevo mazo'} />;
  return <DeckForm key={record.deck?.id ?? 'new'} language={record.language} flashcards={record.flashcards} deck={record.deck} />;
}

interface DeckFormProps {
  language: Language;
  flashcards: Flashcard[];
  deck?: Deck;
}

function DeckForm({ language, flashcards, deck }: DeckFormProps) {
  const repos = useRepositories();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const [baseline] = useState(() => {
    const preselected = (params.get('cartas') ?? '').split(',').filter((id) => flashcards.some((c) => c.id === id));
    const cardIds = deck ? deck.cardIds.filter((id) => flashcards.some((c) => c.id === id)) : preselected;
    return { name: deck?.name ?? '', cardIds, modes: deck?.modes ?? ([] as TraversalMode[]) };
  });
  const [name, setName] = useState(baseline.name);
  const [cardIds, setCardIds] = useState(baseline.cardIds);
  const [modes, setModes] = useState(baseline.modes);
  const [errors, setErrors] = useState<DeckErrors>(NO_ERRORS);
  const [focusTick, setFocusTick] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [picking, setPicking] = useState(false);
  const [editingMode, setEditingMode] = useState<TraversalMode | 'new' | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const dirty = JSON.stringify({ name, cardIds, modes }) !== JSON.stringify(baseline);
  const dirtyRef = useRef(dirty);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);
  const leaveFreely = useRef(false);
  const whenDirty = useCallback(() => dirtyRef.current && !leaveFreely.current, []);

  // Tras un intento de guardado inválido, el foco va al primer campo o sección con error.
  useEffect(() => {
    if (focusTick > 0) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')?.focus();
  }, [focusTick]);

  const cards = cardIds.map((id) => flashcards.find((c) => c.id === id)).filter((c): c is Flashcard => Boolean(c));
  const shown = showAll ? cards : cards.slice(0, PREVIEW);
  const secondaryId = sortFields(language.fields).find((f) => !f.system && f.type === 'text')?.id;
  const backTo = deck ? `/mazos/${deck.id}` : '/mazos';
  const noLayouts = language.layouts.length === 0;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateDeck({ name, cardIds, modes }, language);
    setErrors(found);
    if (hasDeckErrors(found)) { setFocusTick((n) => n + 1); return; }
    const saved: Deck = {
      id: deck?.id ?? newId(),
      languageId: language.id,
      name: name.trim(),
      cardIds,
      modes: modes.map((m) => ({ ...m, name: m.name.trim() })),
      learning: 'free',
    };
    setSaving(true);
    setFailed(false);
    try {
      await repos.decks.save(saved);
      leaveFreely.current = true;
      toast.show({ message: 'Mazo guardado' });
      navigate(`/mazos/${saved.id}`);
    } catch {
      setFailed(true);
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deck) return;
    setSaving(true);
    try {
      await repos.decks.remove(deck.id);
      leaveFreely.current = true;
      toast.show({ message: `Mazo «${deck.name}» eliminado` });
      navigate('/mazos');
    } catch {
      setSaving(false);
      setConfirmingDelete(false);
      setFailed(true);
    }
  }

  function saveMode(mode: TraversalMode) {
    setModes((list) => (list.some((m) => m.id === mode.id) ? list.map((m) => (m.id === mode.id ? mode : m)) : [...list, mode]));
    setErrors((e) => ({ ...e, modes: undefined, modeErrors: Object.fromEntries(Object.entries(e.modeErrors).filter(([id]) => id !== mode.id)) }));
    setEditingMode(null);
  }

  return (
    <>
      <TopBar
        title={deck ? 'Editar mazo' : 'Nuevo mazo'}
        backTo={backTo}
        backLabel="Volver a Mazos"
        actions={
          <Badge className="only-desktop">
            <span className="han" lang={language.code} style={{ fontSize: 13 }} aria-hidden="true">{languageGlyph(language)}</span>
            {language.name}
          </Badge>
        }
      />
      <form ref={formRef} className="page narrow" noValidate style={{ '--w': '820px' } as React.CSSProperties} onSubmit={(e) => void submit(e)}>
        <div className="stack" style={{ '--gap': 'var(--sp-5)' } as React.CSSProperties}>
          <Field label="Nombre" required error={errors.name}>
            {(c) => <Input {...c} placeholder="Ej. HSK 1 · Semana 1" value={name} onChange={(e) => { setName(e.target.value); setErrors((s) => ({ ...s, name: undefined })); }} />}
          </Field>

          <section className="card" aria-labelledby="c-t" tabIndex={-1} data-invalid={errors.cards ? 'true' : undefined}>
            <div className="card-title">
              <h2 id="c-t" className="grow">Flashcards <Badge style={{ marginLeft: 6 }}>{cards.length}</Badge></h2>
              <Button variant="secondary" onClick={() => setPicking(true)}><Plus className="ic" aria-hidden="true" />Agregar</Button>
            </div>
            {cards.length === 0 ? (
              <p className="muted">Todavía no agregaste flashcards.</p>
            ) : (
              <ul className="list" style={{ listStyle: 'none', padding: 0 }}>
                {shown.map((c) => (
                  <li key={c.id} className="item">
                    <CardSummary card={c} language={language} secondaryId={secondaryId} />
                    <IconButton aria-label={`Quitar ${String(c.values.word ?? '')} del mazo`} onClick={() => setCardIds((l) => l.filter((id) => id !== c.id))}>
                      <X className="ic" aria-hidden="true" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
            {cards.length > PREVIEW && (
              <Button variant="ghost" block style={{ marginTop: 'var(--sp-2)' }} onClick={() => setShowAll((v) => !v)}>
                {showAll ? 'Ver menos' : `Ver las ${cards.length} flashcards`}
              </Button>
            )}
            {errors.cards && <p className="error" role="alert" style={{ marginTop: 'var(--sp-2)' }}>{errors.cards}</p>}
          </section>

          <section className="card" aria-labelledby="m-t" tabIndex={-1} data-invalid={errors.modes ? 'true' : undefined}>
            <div className="card-title">
              <h2 id="m-t" className="grow">Modos de recorrida</h2>
              <Button variant="secondary" disabled={noLayouts} onClick={() => setEditingMode('new')}><Plus className="ic" aria-hidden="true" />Agregar modo</Button>
            </div>
            <p className="section-hint">Cada modo define qué layout del idioma se ve en el frente y cuál en el reverso. Al estudiar se elige uno.</p>
            {noLayouts && (
              <Alert tone="warn">
                <span>{language.name} todavía no tiene layouts. <Link to={`/idiomas/${language.id}?tab=layouts`} style={{ fontWeight: 600, textDecoration: 'underline' }}>Crea uno en Idiomas</Link> para armar los modos.</span>
              </Alert>
            )}
            {modes.length > 0 && (
              <ul className="list" style={{ listStyle: 'none', padding: 0 }}>
                {modes.map((m) => (
                  <li key={m.id} className="item" style={{ flexWrap: 'wrap' }}>
                    <span className="meta">
                      <span className="t">{m.name}</span>
                      <span className="s">{describeMode(m, language)}</span>
                      {isModeBroken(m, language) && <span className="tags" style={{ marginTop: 4 }}><Badge tone="err">Layout eliminado</Badge></span>}
                    </span>
                    <IconButton aria-label={`Editar modo ${m.name}`} onClick={() => setEditingMode(m)}><Pencil className="ic" aria-hidden="true" /></IconButton>
                    <IconButton aria-label={`Quitar modo ${m.name}`} onClick={() => setModes((l) => l.filter((x) => x.id !== m.id))}><Trash2 className="ic" aria-hidden="true" /></IconButton>
                    {errors.modeErrors[m.id] && <p className="error" role="alert" style={{ flexBasis: '100%' }}>{errors.modeErrors[m.id]}</p>}
                  </li>
                ))}
              </ul>
            )}
            {errors.modes && <p className="error" role="alert" style={{ marginTop: 'var(--sp-2)' }}>{errors.modes}</p>}
          </section>

          <section className="card" aria-labelledby="l-t">
            <h2 id="l-t" className="card-title">Forma de aprendizaje</h2>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- control asociado con htmlFor; texto anidado */}
            <label className="item hover" htmlFor="forma-libre" style={{ cursor: 'pointer', alignItems: 'flex-start', borderColor: 'var(--primary)', background: 'var(--primary-soft)' }}>
              <input id="forma-libre" type="radio" name="forma" checked readOnly style={{ width: 22, height: 22, accentColor: 'var(--primary)', marginTop: 2 }} />
              <span className="meta"><span className="t">Libre</span><span className="s" style={{ whiteSpace: 'normal' }}>El mazo se recorre siempre en orden aleatorio y no se registra si acertaste.</span></span>
            </label>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- control asociado con htmlFor; texto anidado */}
            <label className="item" htmlFor="forma-espaciado" style={{ marginTop: 'var(--sp-2)', opacity: 0.6, alignItems: 'flex-start' }}>
              <input id="forma-espaciado" type="radio" name="forma" disabled style={{ width: 22, height: 22, marginTop: 2 }} />
              <span className="meta"><span className="t">Repaso espaciado <Badge style={{ marginLeft: 6 }}>Próximamente</Badge></span><span className="s">Disponible en una próxima versión.</span></span>
            </label>
          </section>
        </div>

        {failed && <div style={{ marginTop: 'var(--sp-4)' }}><Alert tone="err">No se pudo completar la operación. Inténtalo de nuevo.</Alert></div>}

        <div className="sticky-foot">
          <Button variant="secondary" onClick={() => navigate(backTo)}>Cancelar</Button>
          {deck && <Button variant="danger-ghost" onClick={() => setConfirmingDelete(true)}><Trash2 className="ic" aria-hidden="true" />Eliminar mazo</Button>}
          <Button type="submit" loading={saving}>Guardar mazo</Button>
        </div>
      </form>

      {picking && (
        <FlashcardPickerDialog
          language={language}
          flashcards={flashcards}
          selected={cardIds}
          onConfirm={(ids) => { setCardIds(ids); setErrors((e) => ({ ...e, cards: undefined })); setPicking(false); }}
          onClose={() => setPicking(false)}
        />
      )}
      {editingMode !== null && (
        <ModeEditorDialog language={language} mode={editingMode === 'new' ? null : editingMode} onSave={saveMode} onClose={() => setEditingMode(null)} />
      )}
      {confirmingDelete && deck && (
        <Dialog
          open
          role="alertdialog"
          title={`¿Eliminar el mazo «${deck.name}»?`}
          onClose={() => setConfirmingDelete(false)}
          footer={
            <>
              <Button variant="secondary" data-autofocus onClick={() => setConfirmingDelete(false)}>Cancelar</Button>
              <Button variant="danger" loading={saving} onClick={() => void confirmDelete()}>Eliminar mazo</Button>
            </>
          }
        >
          <p className="muted">Las flashcards no se eliminan, solo el mazo. Esta acción no se puede deshacer.</p>
        </Dialog>
      )}
      <UnsavedChangesGuard when={whenDirty} />
    </>
  );
}
