import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export interface TagPickerProps {
  /** Set de tags del idioma. */
  options: string[];
  selected: string[];
  languageName: string;
  onChange: (selected: string[]) => void;
  /** Agrega un tag nuevo al set del idioma; resuelve con el nombre definitivo (puede ser uno existente). */
  onCreate: (name: string) => Promise<string>;
}

/** Selección múltiple de tags del idioma, con alta de tags nuevos. Puede quedar vacía. */
export function TagPicker({ options, selected, languageName, onChange, onCreate }: TagPickerProps) {
  const labelId = useId();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  // Los tags seleccionados que ya no están en el set (p. ej. quitados desde Idiomas) siguen visibles.
  const all = [...options, ...selected.filter((t) => !options.includes(t))];
  const toggle = (tag: string) => onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]);

  async function create() {
    if (!name.trim()) { setError('Escribe el nombre del tag.'); return; }
    setBusy(true);
    try {
      const final = await onCreate(name.trim());
      if (!selected.includes(final)) onChange([...selected, final]);
      setCreating(false);
      setName('');
      setError(undefined);
    } catch {
      setError('No se pudo crear el tag. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field">
      <span className="label" id={labelId}>Tags</span>
      <div className="tags" role="group" aria-labelledby={labelId}>
        {all.map((t) => <Chip key={t} selected={selected.includes(t)} onClick={() => toggle(t)}>{t}</Chip>)}
        <Chip onClick={() => setCreating(true)}><Plus className="ic sm" aria-hidden="true" />Nuevo tag</Chip>
      </div>
      <p className="help">Puedes dejar la flashcard sin tags.</p>

      {creating && (
        <Dialog
          open
          title="Nuevo tag"
          onClose={() => { setCreating(false); setError(undefined); }}
          footer={
            <>
              <Button variant="secondary" onClick={() => { setCreating(false); setError(undefined); }}>Cancelar</Button>
              <Button loading={busy} onClick={() => void create()}>Crear y asignar</Button>
            </>
          }
        >
          <form onSubmit={(e) => { e.preventDefault(); void create(); }}>
            <Field label="Nombre del tag" help={`Se agrega al set de tags de ${languageName} y queda disponible para todas las flashcards.`} error={error}>
              {(c) => <Input {...c} data-autofocus placeholder="Ej. Viajes" value={name} onChange={(e) => { setName(e.target.value); setError(undefined); }} />}
            </Field>
          </form>
        </Dialog>
      )}
    </div>
  );
}
