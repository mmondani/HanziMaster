import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { FieldInput } from '@/components/flashcard/field-input';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { applyBulkEdit, bulkEditableFields, describeBulkEdit, validateBulkEdit, type BulkEdit, type TagMode } from '@/lib/domain/bulk-edit';
import { addTag } from '@/lib/domain/field-rules';
import type { Flashcard, Language } from '@/lib/types';

const MODES: { value: TagMode; label: string }[] = [
  { value: 'add', label: 'Agregar' },
  { value: 'remove', label: 'Quitar' },
  { value: 'replace', label: 'Reemplazar' },
];

export interface BulkEditDialogProps {
  language: Language;
  /** Flashcards seleccionadas. */
  cards: Flashcard[];
  /** Se invoca con las versiones editadas (solo las que cambian). */
  onApply: (changed: Flashcard[]) => Promise<void>;
  /** Agrega un tag al set del idioma. */
  onCreateTag: (name: string) => Promise<string>;
  onClose: () => void;
}

/** F06 · Edición masiva de un campo sobre las flashcards seleccionadas. */
export function BulkEditDialog({ language, cards, onApply, onCreateTag, onClose }: BulkEditDialogProps) {
  const fields = bulkEditableFields(language);
  const [fieldId, setFieldId] = useState(fields.find((f) => f.system === 'tags')?.id ?? fields[0]?.id ?? '');
  const field = fields.find((f) => f.id === fieldId);
  const [mode, setMode] = useState<TagMode>('add');
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [newTag, setNewTag] = useState('');
  const [tagError, setTagError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const isTags = field?.system === 'tags';
  const edit = useMemo<BulkEdit>(
    () => (isTags ? { kind: 'tags', mode, tags } : { kind: 'field', fieldId, value: text }),
    [isTags, mode, tags, fieldId, text],
  );
  const error = validateBulkEdit(language, edit);
  const changed = useMemo(() => (error ? [] : applyBulkEdit(language, cards, edit, 0)), [language, cards, edit, error]);
  const summary = error ? error : describeBulkEdit(language, edit, cards.length, changed.length);
  const n = cards.length;

  async function createTag() {
    const result = addTag(language.tags, newTag);
    if (!newTag.trim()) { setTagError('Escribe el nombre del tag.'); return; }
    const final = result.error ? language.tags.find((t) => t.toLowerCase() === newTag.trim().toLowerCase())! : await onCreateTag(newTag.trim());
    setTags((list) => (list.includes(final) ? list : [...list, final]));
    setNewTag('');
    setTagError(undefined);
  }

  async function apply() {
    setBusy(true);
    setFailed(false);
    try {
      // La marca de tiempo definitiva se pone al aplicar.
      const now = Date.now();
      await onApply(changed.map((c) => ({ ...c, updatedAt: now })));
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      title={`Editar ${n} ${n === 1 ? 'flashcard' : 'flashcards'}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button loading={busy} disabled={Boolean(error) || changed.length === 0} onClick={() => void apply()}>Aplicar a {n}</Button>
        </>
      }
    >
      <div className="stack">
        <Field label="Campo a modificar">
          {(c) => (
            <Select {...c} data-autofocus value={fieldId} onChange={(e) => { setFieldId(e.target.value); setText(''); setTags([]); }}>
              {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Select>
          )}
        </Field>

        {isTags ? (
          <>
            <div className="field">
              <span className="label">Acción</span>
              <Segmented label="Acción sobre los tags" options={MODES} value={mode} onChange={setMode} />
            </div>
            <div className="field">
              <span className="label" id="bulk-tags-label">Tags</span>
              <div className="tags" role="group" aria-labelledby="bulk-tags-label">
                {[...language.tags, ...tags.filter((t) => !language.tags.includes(t))].map((t) => (
                  <Chip key={t} selected={tags.includes(t)} onClick={() => setTags((l) => (l.includes(t) ? l.filter((x) => x !== t) : [...l, t]))}>{t}</Chip>
                ))}
              </div>
            </div>
            {mode !== 'remove' && (
              <Field label="Nuevo tag" optional error={tagError}>
                {(c) => (
                  <div className="input-wrap">
                    <Input {...c} placeholder="Ej. Viajes" value={newTag} onChange={(e) => { setNewTag(e.target.value); setTagError(undefined); }} />
                    <Button variant="secondary" onClick={() => void createTag()}><Plus className="ic" aria-hidden="true" />Crear</Button>
                  </div>
                )}
              </Field>
            )}
          </>
        ) : (
          field && <FieldInput field={{ ...field, name: 'Nuevo valor' }} language={language} value={text} onChange={setText} />
        )}

        <Alert tone={error || changed.length === 0 ? 'warn' : 'info'}>{summary}</Alert>
        {failed && <Alert tone="err">No se pudo completar la operación. Inténtalo de nuevo.</Alert>}
      </div>
    </Dialog>
  );
}
