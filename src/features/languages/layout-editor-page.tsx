import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Languages, Plus, Trash2, Volume2 } from 'lucide-react';
import { LayoutCanvas } from '@/components/flashcard/layout-canvas';
import { TopBar } from '@/components/layout/top-bar';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast-provider';
import { UnsavedChangesGuard } from '@/components/ui/unsaved-changes-guard';
import { sortFields } from '@/lib/domain/field-rules';
import { GRID_COLUMNS, MAX_ROWS, checkPlacement, createItem, validateLayoutName } from '@/lib/domain/layout-grid';
import { languageGlyph } from '@/lib/domain/language-presentation';
import { newId } from '@/lib/ids';
import { useLanguages } from '@/lib/languages/languages-provider';
import { useRepositories } from '@/lib/repositories/repositories-provider';
import type { DeckRef } from '@/lib/repositories/types';
import type { Language, Layout, LayoutItem, TextAlign, TextSize } from '@/lib/types';

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: 'S', label: 'S' }, { value: 'M', label: 'M' }, { value: 'L', label: 'L' }, { value: 'XL', label: 'XL' },
];
const ALIGNS: { value: TextAlign; label: string }[] = [
  { value: 'left', label: 'Izq.' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Der.' },
];
const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

/** I04 · Rutas `/idiomas/:id/layouts/nuevo` y `/idiomas/:id/layouts/:layoutId`. */
export function LayoutEditorPage() {
  const { id, layoutId } = useParams();
  const { languages, error, retry } = useLanguages();
  const back = `/idiomas/${id}?tab=layouts`;
  const [fresh] = useState<Layout>(() => ({ id: newId(), name: '', items: [] }));

  if (error) {
    return (
      <>
        <TopBar title="Layout de flashcard" backTo={back} backLabel="Volver al idioma" />
        <div className="page narrow stack" style={{ '--w': '1000px' } as React.CSSProperties}>
          <Alert tone="err">No se pudo cargar el layout.</Alert>
          <Button variant="secondary" onClick={retry}>Reintentar</Button>
        </div>
      </>
    );
  }
  if (languages === null) {
    return (
      <>
        <TopBar title="Layout de flashcard" backTo={back} backLabel="Volver al idioma" />
        <div className="page narrow" role="status" aria-label="Cargando layout" style={{ '--w': '1000px' } as React.CSSProperties}><Skeleton height={240} /></div>
      </>
    );
  }
  const language = languages.find((l) => l.id === id);
  const layout = layoutId ? language?.layouts.find((l) => l.id === layoutId) : fresh;
  if (!language || !layout) {
    return (
      <>
        <TopBar title="Layout de flashcard" backTo="/idiomas" backLabel="Volver a Idiomas" />
        <EmptyState
          icon={<Languages className="ic lg" />}
          title="No se encontró el layout"
          description="Puede que se haya eliminado."
          actions={<Link className="btn btn-primary" to="/idiomas">Ver idiomas</Link>}
        />
      </>
    );
  }
  return <LayoutEditor key={layout.id} language={language} initial={layout} persisted={Boolean(layoutId)} />;
}

interface LayoutEditorProps {
  language: Language;
  initial: Layout;
  persisted: boolean;
}

function LayoutEditor({ language, initial, persisted }: LayoutEditorProps) {
  const repos = useRepositories();
  const toast = useToast();
  const navigate = useNavigate();
  const back = `/idiomas/${language.id}?tab=layouts`;

  const [baseline] = useState(initial);
  const [name, setName] = useState(initial.name);
  const [items, setItems] = useState<LayoutItem[]>(initial.items);
  const [selectedId, setSelectedId] = useState<string | null>(initial.items[0]?.fieldId ?? null);
  const [nameError, setNameError] = useState<string | undefined>();
  const [placementError, setPlacementError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<DeckRef[] | null>(null);

  const dirty = name !== baseline.name || JSON.stringify(items) !== JSON.stringify(baseline.items);
  const dirtyRef = useRef(dirty);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);
  const leaveFreely = useRef(false);
  const whenDirty = useCallback(() => dirtyRef.current && !leaveFreely.current, []);

  const fields = sortFields(language.fields);
  const nameOf = (fieldId: string) => fields.find((f) => f.id === fieldId)?.name ?? fieldId;
  const selected = items.find((i) => i.fieldId === selectedId) ?? null;
  const selectedField = selected ? fields.find((f) => f.id === selected.fieldId) : undefined;
  const unused = fields.filter((f) => !items.some((i) => i.fieldId === f.id));

  /** Aplica un cambio al campo seleccionado solo si cabe y no pisa a otro; si no, informa el motivo. */
  function change(patch: Partial<LayoutItem>) {
    if (!selected) return;
    const next = { ...selected, ...patch };
    const others = items.filter((i) => i.fieldId !== selected.fieldId);
    const result = checkPlacement(next, others);
    if (!result.ok) {
      setPlacementError(
        result.reason === 'overlap'
          ? `Se superpone con «${nameOf(result.withFieldId)}». Elige otra posición o tamaño.`
          : `No cabe en la grilla (${GRID_COLUMNS} columnas, ${MAX_ROWS} filas). Elige otra posición o tamaño.`,
      );
      return;
    }
    setPlacementError(undefined);
    setItems(items.map((i) => (i.fieldId === selected.fieldId ? next : i)));
    if (patch.fieldId) setSelectedId(patch.fieldId);
  }

  function addToLayout(fieldId: string) {
    const item = createItem(fieldId, items);
    setAdding(false);
    if (!item) { setPlacementError('No hay espacio libre en la grilla para otro campo.'); return; }
    setPlacementError(undefined);
    setFormError(undefined);
    setItems([...items, item]);
    setSelectedId(fieldId);
  }

  function removeSelected() {
    if (!selected) return;
    const rest = items.filter((i) => i.fieldId !== selected.fieldId);
    setItems(rest);
    setSelectedId(rest[0]?.fieldId ?? null);
    setPlacementError(undefined);
  }

  async function persist(layouts: Layout[], message: string) {
    setSaving(true);
    try {
      await repos.languages.save({ ...language, layouts });
      leaveFreely.current = true;
      toast.show({ message });
      navigate(back);
    } catch {
      setSaving(false);
      setFormError('No se pudo completar la operación. Inténtalo de nuevo.');
    }
  }

  function save() {
    const error = validateLayoutName(name, language.layouts, baseline.id);
    if (error) { setNameError(error); return; }
    if (items.length === 0) { setFormError('Agrega al menos un campo al layout.'); return; }
    const layout: Layout = { id: baseline.id, name: name.trim(), items };
    const exists = language.layouts.some((l) => l.id === baseline.id);
    void persist(
      exists ? language.layouts.map((l) => (l.id === baseline.id ? layout : l)) : [...language.layouts, layout],
      'Layout guardado',
    );
  }

  async function askDelete() {
    setDeleting(await repos.languages.decksUsingLayout(language.id, baseline.id));
  }

  const affectedModes = deleting?.reduce((n, d) => n + d.modes, 0) ?? 0;

  return (
    <>
      <TopBar
        title="Layout de flashcard"
        backTo={back}
        backLabel="Volver al idioma"
        actions={
          <Badge className="only-desktop">
            <span className="han" lang={language.code} style={{ fontSize: 13 }} aria-hidden="true">{languageGlyph(language)}</span>
            {language.name}
          </Badge>
        }
      />
      <div className="page narrow" style={{ '--w': '1000px' } as React.CSSProperties}>
        <div style={{ marginBottom: 'var(--sp-5)', maxWidth: 480 }}>
          <Field label="Nombre del layout" required error={nameError}>
            {(c) => <Input {...c} value={name} onChange={(e) => { setName(e.target.value); setNameError(undefined); }} />}
          </Field>
        </div>

        <div className="split two-one">
          <section aria-labelledby="cv-t" className="stack" style={{ '--gap': 'var(--sp-3)' } as React.CSSProperties}>
            <div className="row">
              <h2 id="cv-t" className="grow">Disposición</h2>
              <span className="xs muted">Grilla de {GRID_COLUMNS} columnas</span>
            </div>
            <LayoutCanvas items={items} fields={fields} selectedFieldId={selectedId} onSelect={setSelectedId} minRows={6} label="Disposición de la flashcard" />
            <p className="xs muted">Selecciona un campo y ajusta su posición y tamaño con los controles.</p>
            {selectedField?.tts && (
              <Alert tone="info">
                <span>El campo <strong>{selectedField.name}</strong> tiene audio: en el recorrido se mostrará el ícono <Volume2 className="ic sm" aria-hidden="true" /> junto a él.</span>
              </Alert>
            )}
          </section>

          <aside className="stack" style={{ '--gap': 'var(--sp-4)' } as React.CSSProperties}>
            <section className="card" aria-labelledby="pr-t">
              <h2 id="pr-t" className="card-title">Campo seleccionado</h2>
              {selected ? (
                <div className="stack" style={{ '--gap': 'var(--sp-3)' } as React.CSSProperties}>
                  <Field label="Campo">
                    {(c) => (
                      <Select {...c} value={selected.fieldId} onChange={(e) => change({ fieldId: e.target.value })}>
                        <option value={selected.fieldId}>{nameOf(selected.fieldId)}</option>
                        {unused.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </Select>
                    )}
                  </Field>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <Field label="Columna">{(c) => <Select {...c} value={selected.col} onChange={(e) => change({ col: Number(e.target.value) })}>{range(GRID_COLUMNS).map((n) => <option key={n}>{n}</option>)}</Select>}</Field>
                    <Field label="Fila">{(c) => <Select {...c} value={selected.row} onChange={(e) => change({ row: Number(e.target.value) })}>{range(MAX_ROWS).map((n) => <option key={n}>{n}</option>)}</Select>}</Field>
                    <Field label="Ancho">{(c) => <Select {...c} value={selected.colSpan} onChange={(e) => change({ colSpan: Number(e.target.value) })}>{range(GRID_COLUMNS).map((n) => <option key={n}>{n}</option>)}</Select>}</Field>
                    <Field label="Alto">{(c) => <Select {...c} value={selected.rowSpan} onChange={(e) => change({ rowSpan: Number(e.target.value) })}>{range(MAX_ROWS).map((n) => <option key={n}>{n}</option>)}</Select>}</Field>
                  </div>
                  {placementError && <p className="error" role="alert">{placementError}</p>}
                  <div className="field"><span className="label">Tamaño del texto</span><Segmented label="Tamaño del texto" options={TEXT_SIZES} value={selected.textSize} onChange={(textSize) => change({ textSize })} /></div>
                  <div className="field"><span className="label">Alineación</span><Segmented label="Alineación" options={ALIGNS} value={selected.align} onChange={(align) => change({ align })} /></div>
                  <Button variant="danger-ghost" onClick={removeSelected}><Trash2 className="ic" aria-hidden="true" />Quitar del layout</Button>
                </div>
              ) : (
                <>
                  <p className="muted">Todavía no hay campos en el layout. Agrega el primero.</p>
                  {placementError && <p className="error" role="alert">{placementError}</p>}
                </>
              )}
            </section>
            <Button variant="secondary" block disabled={unused.length === 0} onClick={() => setAdding(true)}>
              <Plus className="ic" aria-hidden="true" />Agregar campo al layout
            </Button>
            {unused.length === 0 && <p className="xs muted">Todos los campos del idioma ya están en el layout.</p>}
          </aside>
        </div>

        {formError && <div style={{ marginTop: 'var(--sp-4)' }}><Alert tone="err">{formError}</Alert></div>}

        <div className="sticky-foot">
          <Button variant="secondary" onClick={() => navigate(back)}>Cancelar</Button>
          {persisted && <Button variant="danger-ghost" onClick={() => void askDelete()}><Trash2 className="ic" aria-hidden="true" />Eliminar layout</Button>}
          <Button loading={saving} onClick={save}>Guardar layout</Button>
        </div>
      </div>

      <Dialog open={adding} title="Agregar campo al layout" onClose={() => setAdding(false)}>
        <ul className="list" style={{ listStyle: 'none', padding: 0 }}>
          {unused.map((f) => (
            <li key={f.id}><button type="button" className="item hover" style={{ width: '100%', textAlign: 'left' }} onClick={() => addToLayout(f.id)}>{f.name}</button></li>
          ))}
        </ul>
      </Dialog>

      <Dialog
        open={deleting !== null}
        role="alertdialog"
        title={`¿Eliminar el layout «${baseline.name}»?`}
        onClose={() => setDeleting(null)}
        footer={
          <>
            <Button variant="secondary" data-autofocus onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button variant="danger" loading={saving} onClick={() => void persist(language.layouts.filter((l) => l.id !== baseline.id), 'Layout eliminado')}>Eliminar</Button>
          </>
        }
      >
        {affectedModes > 0 ? (
          <Alert tone="warn">
            <span>
              <strong>Lo usan {affectedModes} {affectedModes === 1 ? 'modo' : 'modos'} de recorrida en {deleting!.length} {deleting!.length === 1 ? 'mazo' : 'mazos'}</strong>{' '}
              ({deleting!.map((d) => `«${d.name}»`).join(' y ')}). Una vez eliminado, esos mazos <strong>dejarán de poder usarse</strong> hasta que cambies el layout de sus modos. Esta acción no se puede deshacer.
            </span>
          </Alert>
        ) : (
          <p className="muted">Ningún mazo usa este layout. Esta acción no se puede deshacer.</p>
        )}
      </Dialog>
      <UnsavedChangesGuard when={whenDirty} />
    </>
  );
}
