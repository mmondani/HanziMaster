import { useState } from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Switch } from '@/components/ui/switch';
import { isSystemField, sortFields, validateFieldName } from '@/lib/domain/field-rules';
import { newId } from '@/lib/ids';
import type { FieldDef, FieldType, FieldValue } from '@/lib/types';

const TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'list', label: 'Lista' },
  { value: 'number', label: 'Número' },
];

function defaultToText(value: FieldValue | undefined): string {
  if (value === undefined) return '';
  return Array.isArray(value) ? value.join(', ') : String(value);
}

function textToDefault(text: string, type: FieldType): FieldValue | undefined {
  const t = text.trim();
  if (!t) return undefined;
  if (type === 'number') return Number.isFinite(Number(t)) ? Number(t) : undefined;
  if (type === 'list') return t.split(',').map((s) => s.trim()).filter(Boolean);
  return t;
}

export interface FieldEditorDialogProps {
  /** `null` = campo nuevo. */
  field: FieldDef | null;
  /** Todos los campos del idioma (para validar nombres y reordenar). */
  fields: FieldDef[];
  /** Layouts que hoy muestran el campo (para avisar el impacto al eliminarlo). */
  layoutsUsing: number;
  onSave: (field: FieldDef) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onClose: () => void;
}

/** I03 · Editor de campo (diálogo sobre el editor de idioma). Se monta al abrir. */
export function FieldEditorDialog({ field, fields, layoutsUsing, onSave, onDelete, onMove, onClose }: FieldEditorDialogProps) {
  const system = field ? isSystemField(field) : false;
  const [name, setName] = useState(field?.name ?? '');
  const [description, setDescription] = useState(field?.description ?? '');
  const [type, setType] = useState<FieldType>(field?.type ?? 'text');
  const [defaultText, setDefaultText] = useState(defaultToText(field?.defaultValue));
  const [tts, setTts] = useState(field?.tts ?? false);
  const [required, setRequired] = useState(field?.required ?? false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const lockedRequired = field?.system === 'word' || field?.system === 'translation';
  const sorted = sortFields(fields);
  const index = field ? sorted.findIndex((f) => f.id === field.id) : -1;

  function save() {
    const error = validateFieldName(name, fields, field?.id);
    if (error) { setNameError(error); return; }
    onSave({
      id: field?.id ?? newId(),
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      defaultValue: textToDefault(defaultText, type),
      tts: type === 'text' && tts,
      required: lockedRequired || required,
      system: field?.system,
      order: field?.order ?? fields.length,
    });
  }

  if (confirmingDelete && field) {
    return (
      <Dialog
        open
        role="alertdialog"
        title={`¿Eliminar el campo «${field.name}»?`}
        onClose={() => setConfirmingDelete(false)}
        footer={
          <>
            <Button variant="secondary" data-autofocus onClick={() => setConfirmingDelete(false)}>Cancelar</Button>
            <Button variant="danger" onClick={() => onDelete(field.id)}>Eliminar campo</Button>
          </>
        }
      >
        <Alert tone="warn">
          Se borrará el dato de este campo en todas las flashcards del idioma
          {layoutsUsing > 0 ? ` y se quitará de ${layoutsUsing} ${layoutsUsing === 1 ? 'layout' : 'layouts'}` : ''}.
          Los cambios se aplican al guardar el idioma.
        </Alert>
      </Dialog>
    );
  }

  return (
    <Dialog
      open
      title={field ? 'Editar campo' : 'Nuevo campo'}
      onClose={onClose}
      footer={
        <>
          {field && !system && (
            <Button variant="danger-ghost" style={{ flex: 'none' }} onClick={() => setConfirmingDelete(true)}>
              <Trash2 className="ic" aria-hidden="true" />Eliminar
            </Button>
          )}
          <span className="grow" />
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Guardar</Button>
        </>
      }
    >
      <div className="stack">
        <Field label="Nombre" required error={nameError}>
          {(c) => <Input {...c} data-autofocus value={name} onChange={(e) => { setName(e.target.value); setNameError(undefined); }} />}
        </Field>
        <Field label="Descripción" optional help="Se muestra como ayuda al completar la flashcard.">
          {(c) => <Input {...c} value={description} onChange={(e) => setDescription(e.target.value)} />}
        </Field>
        <div className="field">
          <span className="label">Tipo</span>
          <Segmented label="Tipo de campo" options={TYPE_OPTIONS} value={type} onChange={setType} disabled={system} />
          {system && <p className="help">El tipo de los campos del sistema no se puede cambiar.</p>}
        </div>
        <Field
          label="Valor por defecto"
          optional
          help={type === 'list' ? 'Separa los elementos con comas. Vacío si se deja en blanco.' : 'Vacío si se deja en blanco.'}
        >
          {(c) => (
            <Input {...c} type={type === 'number' ? 'number' : 'text'} placeholder="Vacío" value={defaultText} onChange={(e) => setDefaultText(e.target.value)} />
          )}
        </Field>
        <div className="sep" style={{ margin: 0 }} />
        <div>
          <Switch label="Text-to-speech" checked={type === 'text' && tts} disabled={type !== 'text'} onChange={(e) => setTts(e.target.checked)} />
          <p className="small muted">
            {type === 'text' ? 'Muestra un ícono de audio para escuchar este campo.' : 'Solo disponible para campos de texto.'}
          </p>
        </div>
        <div>
          <Switch label="Obligatorio" checked={lockedRequired || required} disabled={lockedRequired} onChange={(e) => setRequired(e.target.checked)} />
          <p className="small muted">
            {lockedRequired ? 'Este campo del sistema siempre es obligatorio.' : 'No se puede guardar una flashcard sin completarlo.'}
          </p>
        </div>
        {field && (
          <div className="row">
            <Button variant="secondary" className="grow" disabled={index <= 0} onClick={() => onMove(field.id, -1)}>
              <ArrowUp className="ic" aria-hidden="true" />Mover arriba
            </Button>
            <Button variant="secondary" className="grow" disabled={index === sorted.length - 1} onClick={() => onMove(field.id, 1)}>
              <ArrowDown className="ic" aria-hidden="true" />Mover abajo
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
