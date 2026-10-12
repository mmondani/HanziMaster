import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, Trash2 } from 'lucide-react';
import { FieldInput } from '@/components/flashcard/field-input';
import { TopBar } from '@/components/layout/top-bar';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-provider';
import { UnsavedChangesGuard } from '@/components/ui/unsaved-changes-guard';
import { useDecks } from '@/lib/decks/decks-provider';
import { buildValues, formFields, toFormValues, validateFlashcard, type FormErrors } from '@/lib/domain/flashcard-form';
import { languageGlyph } from '@/lib/domain/language-presentation';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';
import { newId } from '@/lib/ids';
import { useRepositories } from '@/lib/repositories/repositories-provider';
import type { FieldDef, Flashcard, Language } from '@/lib/types';
import { DeleteFlashcardDialog } from './delete-flashcard-dialog';
import { RecordStatusView } from './record-status-view';
import { TagPicker } from './tag-picker';
import { useCreateTag } from './use-create-tag';
import { useDeleteFlashcard } from './use-delete-flashcard';
import { useAiCompletion } from './use-ai-completion';
import { useFlashcardRecord } from './use-flashcard-record';

/** F03 · Rutas `/flashcards/nueva` y `/flashcards/:id/editar`. */
export function FlashcardFormPage() {
  const { id } = useParams();
  const record = useFlashcardRecord(id);
  if (record.status !== 'ready') return <RecordStatusView record={record} title={id ? 'Editar flashcard' : 'Nueva flashcard'} />;
  return <FlashcardForm key={record.card?.id ?? 'new'} language={record.language} card={record.card} />;
}

function FlashcardForm({ language, card }: { language: Language; card?: Flashcard }) {
  const repos = useRepositories();
  const { decks } = useDecks();
  const toast = useToast();
  const navigate = useNavigate();
  const deleteFlashcard = useDeleteFlashcard();
  const createTag = useCreateTag(language);
  const formRef = useRef<HTMLFormElement>(null);

  const [baseline] = useState(() => ({ values: toFormValues(language, card), tags: card?.tags ?? [] }));
  const [values, setValues] = useState(baseline.values);
  const [tags, setTags] = useState(baseline.tags);
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusTick, setFocusTick] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const dirty = JSON.stringify({ values, tags }) !== JSON.stringify(baseline);
  const dirtyRef = useRef(dirty);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);
  const leaveFreely = useRef(false);
  const whenDirty = useCallback(() => dirtyRef.current && !leaveFreely.current, []);

  // Tras un intento de guardado inválido, el foco va al primer campo con error.
  useEffect(() => {
    if (focusTick > 0) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusTick]);

  const fields = formFields(language);
  const wordField = fields.find((f) => f.system === 'word');
  const wordText = (wordField ? values[wordField.id] ?? '' : '').trim();
  const aiNoteId = useId();
  const online = useOnlineStatus();
  const aiCompletion = useAiCompletion(language, wordField?.id);
  const aiLoading = aiCompletion.status === 'loading';
  const aiNote = !online
    ? 'Requiere conexión para completar con IA.'
    : 'Escribe la palabra y usa la IA para completar los demás campos y los tags.';
  const backTo = card ? `/flashcards/${card.id}` : '/flashcards';
  const deckCount = card ? (decks ?? []).filter((d) => d.cardIds.includes(card.id)).length : 0;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateFlashcard(language, values);
    setErrors(found);
    if (Object.keys(found).length > 0) { setFocusTick((n) => n + 1); return; }
    const now = Date.now();
    setSaving(true);
    setSaveError(false);
    try {
      await repos.flashcards.save({
        id: card?.id ?? newId(),
        languageId: language.id,
        values: buildValues(language, values),
        tags,
        createdAt: card?.createdAt ?? now,
        updatedAt: now,
      });
      leaveFreely.current = true;
      toast.show({ message: 'Flashcard guardada' });
      navigate(backTo);
    } catch {
      setSaveError(true);
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!card) return;
    setSaving(true);
    leaveFreely.current = true;
    try {
      await deleteFlashcard(card.id);
    } catch {
      leaveFreely.current = false;
      setSaving(false);
      setConfirmingDelete(false);
      setSaveError(true);
    }
  }

  async function completeWithAi() {
    const result = await aiCompletion.complete({ values, tags });
    if (!result) return;
    setValues(result.values);
    setTags(result.tags);
    setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => !(result.values[id] ?? '').trim())));
  }

  const aiButton = aiCompletion.available && wordField && (
    <Button
      variant="ai"
      loading={aiLoading}
      disabled={!wordText || !online}
      aria-describedby={aiNoteId}
      aria-label={aiLoading ? 'Completando…' : aiButtonLabel(aiCompletion.status === 'done', !!card)}
      onClick={() => void completeWithAi()}
    >
      <Sparkles className="ic" aria-hidden="true" />
      <span className="only-desktop" aria-hidden="true">{aiLoading ? 'Completando…' : aiButtonLabel(aiCompletion.status === 'done', !!card)}</span>
      <span className="only-mobile" aria-hidden="true">{aiLoading ? '…' : 'IA'}</span>
    </Button>
  );

  const renderField = (f: FieldDef) => {
    const isWord = f.id === wordField?.id;
    const fromAi = !isWord && (values[f.id] ?? '').trim() !== '' && values[f.id].trim() === aiCompletion.applied.values[f.id];
    return (
      <FieldInput
        key={f.id}
        field={f}
        language={language}
        value={values[f.id] ?? ''}
        error={errors[f.id]}
        onChange={(v) => setValues((s) => ({ ...s, [f.id]: v }))}
        fromAi={fromAi}
        loading={aiLoading && !isWord}
        disabled={aiLoading && isWord}
        action={isWord ? aiButton : undefined}
        note={isWord && aiButton ? { id: aiNoteId, text: aiNote } : undefined}
      />
    );
  };

  const [first, ...rest] = fields;

  return (
    <>
      <TopBar
        title={card ? 'Editar flashcard' : 'Nueva flashcard'}
        backTo={backTo}
        backLabel="Volver"
        actions={
          <Badge className="only-desktop">
            <span className="han" lang={language.code} style={{ fontSize: 13 }} aria-hidden="true">{languageGlyph(language)}</span>
            {language.name}
          </Badge>
        }
      />
      <form ref={formRef} className="page narrow" noValidate style={{ '--w': '760px' } as React.CSSProperties} onSubmit={(e) => void submit(e)}>
        {aiCompletion.status === 'done' && (
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            {aiCompletion.filledCount > 0 ? (
              <Alert tone="ai"><strong>Completado con IA.</strong> Revisa los campos y corrige lo que haga falta antes de guardar. Los tags se eligieron entre los existentes (máx. 2).</Alert>
            ) : (
              <Alert tone="info">La IA no tenía nada nuevo para completar: los campos ya tienen contenido.</Alert>
            )}
          </div>
        )}
        {aiCompletion.status === 'error' && (
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <Alert tone="err">
              No se pudo completar con IA. Puedes reintentar o llenar los campos a mano.{' '}
              <Button variant="ghost" onClick={() => void completeWithAi()} disabled={!wordText || !online}>Reintentar</Button>
            </Alert>
          </div>
        )}
        {Object.keys(errors).length > 1 && (
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <Alert tone="err">Hay {Object.keys(errors).length} campos por completar.</Alert>
          </div>
        )}
        <div className="stack" style={{ '--gap': 'var(--sp-5)' } as React.CSSProperties}>
          {first && renderField(first)}
          <div className="form-grid two">{rest.map(renderField)}</div>
          <div inert={aiLoading} aria-busy={aiLoading || undefined}>
            <TagPicker options={language.tags} selected={tags} languageName={language.name} onChange={setTags} onCreate={createTag} />
          </div>
        </div>

        {saveError && <div style={{ marginTop: 'var(--sp-4)' }}><Alert tone="err">No se pudo completar la operación. Inténtalo de nuevo.</Alert></div>}

        <div className="sticky-foot">
          <Button variant="secondary" onClick={() => navigate(backTo)}>Cancelar</Button>
          {card && <Button variant="danger-ghost" onClick={() => setConfirmingDelete(true)}><Trash2 className="ic" aria-hidden="true" />Eliminar</Button>}
          <Button type="submit" loading={saving}>Guardar</Button>
        </div>
      </form>

      {confirmingDelete && <DeleteFlashcardDialog deckCount={deckCount} busy={saving} onConfirm={() => void confirmDelete()} onClose={() => setConfirmingDelete(false)} />}
      <UnsavedChangesGuard when={whenDirty} />
    </>
  );
}

function aiButtonLabel(done: boolean, editing: boolean): string {
  if (editing) return 'Volver a completar con IA';
  return done ? 'Completar de nuevo' : 'Completar con IA';
}
