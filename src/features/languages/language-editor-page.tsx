import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Languages, Trash2 } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast-provider';
import { UnsavedChangesGuard } from '@/components/ui/unsaved-changes-guard';
import {
  addField, createLanguage, layoutsUsingField, moveField, removeField, removeFieldFromLayouts,
  updateField, validateLanguageName,
} from '@/lib/domain/field-rules';
import { LANGUAGE_CODES } from '@/lib/domain/language-presentation';
import { useLanguages } from '@/lib/languages/languages-provider';
import { useRepositories } from '@/lib/repositories/repositories-provider';
import type { FieldDef, Language } from '@/lib/types';
import { DeleteLanguageDialog } from './delete-language-dialog';
import { FieldEditorDialog } from './field-editor-dialog';
import { FieldsPanel } from './fields-panel';
import { LayoutsPanel } from './layouts-panel';
import { TagsPanel } from './tags-panel';

const TABS = [
  { id: 'campos', label: 'Campos' },
  { id: 'tags', label: 'Tags' },
  { id: 'layouts', label: 'Layouts' },
];

/** I02 · Rutas `/idiomas/nuevo` y `/idiomas/:id`. */
export function LanguageEditorPage() {
  const { id } = useParams();
  const { languages, error, retry } = useLanguages();
  const [fresh] = useState(() => createLanguage('', LANGUAGE_CODES[0].code));

  if (!id) return <LanguageEditor initial={fresh} persisted={false} />;
  if (error) {
    return (
      <>
        <TopBar title="Idioma" backTo="/idiomas" backLabel="Volver a Idiomas" />
        <div className="page narrow stack" style={{ '--w': '820px' } as React.CSSProperties}>
          <Alert tone="err">No se pudo cargar el idioma.</Alert>
          <Button variant="secondary" onClick={retry}>Reintentar</Button>
        </div>
      </>
    );
  }
  if (languages === null) {
    return (
      <>
        <TopBar title="Idioma" backTo="/idiomas" backLabel="Volver a Idiomas" />
        <div className="page narrow" role="status" aria-label="Cargando idioma" style={{ '--w': '820px' } as React.CSSProperties}><Skeleton height={120} /></div>
      </>
    );
  }
  const language = languages.find((l) => l.id === id);
  if (!language) {
    return (
      <>
        <TopBar title="Idioma" backTo="/idiomas" backLabel="Volver a Idiomas" />
        <EmptyState
          icon={<Languages className="ic lg" />}
          title="No se encontró el idioma"
          description="Puede que se haya eliminado."
          actions={<Link className="btn btn-primary" to="/idiomas">Ver idiomas</Link>}
        />
      </>
    );
  }
  return <LanguageEditor key={language.id} initial={language} persisted />;
}

interface LanguageEditorProps {
  initial: Language;
  persisted: boolean;
}

function LanguageEditor({ initial, persisted }: LanguageEditorProps) {
  const { languages, usage } = useLanguages();
  const repos = useRepositories();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab')! : 'campos';

  const [baseline] = useState(initial);
  const [name, setName] = useState(initial.name);
  const [code, setCode] = useState(initial.code);
  const [fields, setFields] = useState(initial.fields);
  const [tags, setTags] = useState(initial.tags);
  const [nameError, setNameError] = useState<string | undefined>();
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [deleting, setDeleting] = useState(false);

  const dirty =
    name !== baseline.name || code !== baseline.code ||
    JSON.stringify(fields) !== JSON.stringify(baseline.fields) ||
    JSON.stringify(tags) !== JSON.stringify(baseline.tags);
  const dirtyRef = useRef(dirty);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);
  const leaveFreely = useRef(false);
  const whenDirty = useCallback(() => dirtyRef.current && !leaveFreely.current, []);

  const codes = LANGUAGE_CODES.some((c) => c.code === code) ? LANGUAGE_CODES : [{ code, label: code }, ...LANGUAGE_CODES];
  const editingField = editingId && editingId !== 'new' ? fields.find((f) => f.id === editingId) ?? null : null;

  async function save() {
    const error = validateLanguageName(name, languages ?? [], baseline.id);
    if (error) { setNameError(error); return; }
    const removedFieldIds = baseline.fields.filter((f) => !fields.some((x) => x.id === f.id)).map((f) => f.id);
    const removedTags = baseline.tags.filter((t) => !tags.includes(t));
    let layouts = initial.layouts;
    for (const fieldId of removedFieldIds) layouts = removeFieldFromLayouts(layouts, fieldId);
    setSaving(true);
    setSaveError(false);
    try {
      await repos.languages.save({ ...initial, name: name.trim(), code, fields, tags, layouts }, { removedFieldIds, removedTags });
      leaveFreely.current = true;
      toast.show({ message: 'Idioma guardado' });
      navigate('/idiomas');
    } catch {
      setSaveError(true);
      setSaving(false);
    }
  }

  async function removeLanguage() {
    setSaving(true);
    try {
      await repos.languages.remove(baseline.id);
      leaveFreely.current = true;
      toast.show({ message: `Idioma «${baseline.name}» eliminado` });
      navigate('/idiomas');
    } catch {
      setSaving(false);
      setDeleting(false);
      setSaveError(true);
    }
  }

  function saveField(field: FieldDef) {
    setFields((list) => (editingId === 'new' ? addField(list, field) : updateField(list, field)));
    setEditingId(null);
  }

  const deleteButton = persisted ? (
    <Button variant="danger-ghost" className="only-desktop" onClick={() => setDeleting(true)}>
      <Trash2 className="ic" aria-hidden="true" />Eliminar idioma
    </Button>
  ) : undefined;

  return (
    <>
      <TopBar title={persisted ? baseline.name : 'Nuevo idioma'} backTo="/idiomas" backLabel="Volver a Idiomas" actions={deleteButton} />
      <div className="page narrow" style={{ '--w': '820px' } as React.CSSProperties}>
        <div className="form-grid two" style={{ margin: 'var(--sp-2) 0 var(--sp-4)' }}>
          <Field label="Nombre del idioma" required help="Así aparece en los listados y en el selector de idioma." error={nameError}>
            {(c) => <Input {...c} value={name} onChange={(e) => { setName(e.target.value); setNameError(undefined); }} />}
          </Field>
          <Field label="Código de idioma" required help="Se usa para el audio (text-to-speech) y para mostrar bien los caracteres.">
            {(c) => (
              <Select {...c} value={code} onChange={(e) => setCode(e.target.value)}>
                {codes.map((o) => <option key={o.code} value={o.code}>{o.code} · {o.label}</option>)}
              </Select>
            )}
          </Field>
        </div>

        <Tabs label="Configuración del idioma" items={TABS} value={tab} onChange={(t) => setParams({ tab: t }, { replace: true })}>
          {tab === 'campos' && <FieldsPanel fields={fields} onAdd={() => setEditingId('new')} onEdit={(f) => setEditingId(f.id)} />}
          {tab === 'tags' && <TagsPanel tags={tags} onChange={setTags} />}
          {tab === 'layouts' && <LayoutsPanel language={{ ...initial, fields }} persisted={persisted} />}
        </Tabs>

        {saveError && <div style={{ marginTop: 'var(--sp-4)' }}><Alert tone="err">No se pudo completar la operación. Inténtalo de nuevo.</Alert></div>}

        <div className="sticky-foot">
          <Button variant="secondary" onClick={() => navigate('/idiomas')}>Cancelar</Button>
          <Button loading={saving} onClick={() => void save()}>Guardar idioma</Button>
        </div>
        {persisted && (
          <div className="only-mobile" style={{ marginTop: 'var(--sp-4)' }}>
            <Button variant="danger-ghost" block onClick={() => setDeleting(true)}><Trash2 className="ic" aria-hidden="true" />Eliminar idioma</Button>
          </div>
        )}
      </div>

      {editingId !== null && (editingId === 'new' || editingField) && (
        <FieldEditorDialog
          key={editingId}
          field={editingField}
          fields={fields}
          layoutsUsing={editingField ? layoutsUsingField(initial.layouts, editingField.id).length : 0}
          onSave={saveField}
          onDelete={(fieldId) => { setFields((list) => removeField(list, fieldId)); setEditingId(null); }}
          onMove={(fieldId, dir) => setFields((list) => moveField(list, fieldId, dir))}
          onClose={() => setEditingId(null)}
        />
      )}
      {deleting && (
        <DeleteLanguageDialog language={baseline} usage={usage[baseline.id]} busy={saving} onConfirm={() => void removeLanguage()} onClose={() => setDeleting(false)} />
      )}
      <UnsavedChangesGuard when={whenDirty} />
    </>
  );
}
