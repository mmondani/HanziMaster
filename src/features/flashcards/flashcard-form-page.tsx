import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { FieldInput } from '@/components/flashcard/field-input';
import { TopBar } from '@/components/layout/top-bar';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast-provider';
import { UnsavedChangesGuard } from '@/components/ui/unsaved-changes-guard';
import { useDecks } from '@/lib/decks/decks-provider';
import { addTag } from '@/lib/domain/field-rules';
import { buildValues, formFields, toFormValues, validateFlashcard, type FormErrors } from '@/lib/domain/flashcard-form';
import { languageGlyph } from '@/lib/domain/language-presentation';
import { newId } from '@/lib/ids';
import { useRepositories } from '@/lib/repositories/repositories-provider';
import type { Flashcard, Language } from '@/lib/types';
import { DeleteFlashcardDialog } from './delete-flashcard-dialog';
import { RecordStatusView } from './record-status-view';
import { TagPicker } from './tag-picker';
import { useDeleteFlashcard } from './use-delete-flashcard';
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

  /** Alta de un tag desde el formulario: queda en el set del idioma. Si ya existe, se reutiliza. */
  async function createTag(raw: string): Promise<string> {
    const existing = language.tags.find((t) => t.toLowerCase() === raw.toLowerCase());
    if (existing) return existing;
    const { tags: next } = addTag(language.tags, raw);
    await repos.languages.save({ ...language, tags: next });
    return raw.trim();
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
        {Object.keys(errors).length > 1 && (
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <Alert tone="err">Hay {Object.keys(errors).length} campos por completar.</Alert>
          </div>
        )}
        <div className="stack" style={{ '--gap': 'var(--sp-5)' } as React.CSSProperties}>
          {first && <FieldInput field={first} language={language} value={values[first.id] ?? ''} error={errors[first.id]} onChange={(v) => setValues((s) => ({ ...s, [first.id]: v }))} />}
          <div className="form-grid two">
            {rest.map((f) => (
              <FieldInput key={f.id} field={f} language={language} value={values[f.id] ?? ''} error={errors[f.id]} onChange={(v) => setValues((s) => ({ ...s, [f.id]: v }))} />
            ))}
          </div>
          <TagPicker options={language.tags} selected={tags} languageName={language.name} onChange={setTags} onCreate={createTag} />
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
