import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { newId } from '@/lib/ids';
import type { Language, TraversalMode } from '@/lib/types';

export interface ModeEditorDialogProps {
  language: Language;
  /** `null` = modo nuevo. */
  mode: TraversalMode | null;
  onSave: (mode: TraversalMode) => void;
  onClose: () => void;
}

/** Alta y edición de un modo de recorrida: nombre y layouts de frente y reverso (los del idioma). */
export function ModeEditorDialog({ language, mode, onSave, onClose }: ModeEditorDialogProps) {
  const layouts = language.layouts;
  const exists = (id: string | undefined) => (id && layouts.some((l) => l.id === id) ? id : '');
  const [name, setName] = useState(mode?.name ?? '');
  const [front, setFront] = useState(exists(mode?.frontLayoutId) || (mode ? '' : layouts[0]?.id ?? ''));
  const [back, setBack] = useState(exists(mode?.backLayoutId) || (mode ? '' : layouts[1]?.id ?? layouts[0]?.id ?? ''));
  const [errors, setErrors] = useState<{ name?: string; front?: string; back?: string }>({});

  function save() {
    const next = {
      name: name.trim() ? undefined : 'El nombre es obligatorio.',
      front: front ? undefined : 'Elige un layout.',
      back: back ? undefined : 'Elige un layout.',
    };
    setErrors(next);
    if (next.name || next.front || next.back) return;
    onSave({ id: mode?.id ?? newId(), name: name.trim(), frontLayoutId: front, backLayoutId: back });
  }

  const options = (
    <>
      <option value="">Elige un layout…</option>
      {layouts.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
    </>
  );

  return (
    <Dialog
      open
      title={mode ? 'Editar modo de recorrida' : 'Nuevo modo de recorrida'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>{mode ? 'Guardar modo' : 'Agregar modo'}</Button>
        </>
      }
    >
      <div className="stack">
        <Field label="Nombre del modo" required error={errors.name}>
          {(c) => <Input {...c} data-autofocus placeholder="Ej. Palabra → Significado" value={name} onChange={(e) => { setName(e.target.value); setErrors((s) => ({ ...s, name: undefined })); }} />}
        </Field>
        <Field label="Layout del frente" required error={errors.front}>
          {(c) => <Select {...c} value={front} onChange={(e) => { setFront(e.target.value); setErrors((s) => ({ ...s, front: undefined })); }}>{options}</Select>}
        </Field>
        <Field label="Layout del reverso" required error={errors.back}>
          {(c) => <Select {...c} value={back} onChange={(e) => { setBack(e.target.value); setErrors((s) => ({ ...s, back: undefined })); }}>{options}</Select>}
        </Field>
      </div>
    </Dialog>
  );
}
