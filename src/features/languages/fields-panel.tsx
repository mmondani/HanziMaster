import { Lock, Pencil, Plus, Volume2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { isSystemField, sortFields } from '@/lib/domain/field-rules';
import type { FieldDef, FieldType } from '@/lib/types';

const TYPE_LABEL: Record<FieldType, string> = { text: 'Texto', list: 'Lista', number: 'Número' };

export interface FieldsPanelProps {
  fields: FieldDef[];
  onAdd: () => void;
  onEdit: (field: FieldDef) => void;
}

/** Pestaña "Campos" del editor de idioma. */
export function FieldsPanel({ fields, onAdd, onEdit }: FieldsPanelProps) {
  return (
    <section className="section" aria-label="Campos">
      <div className="row" style={{ marginBottom: 'var(--sp-2)' }}>
        <p className="section-hint grow" style={{ margin: 0 }}>
          Los campos Palabra, Traducción y Tags son obligatorios del sistema y no se pueden eliminar.
        </p>
        <Button variant="secondary" onClick={onAdd}>
          <Plus className="ic" aria-hidden="true" />
          <span className="only-desktop">Agregar campo</span>
          <span className="only-mobile" aria-hidden="true">Campo</span>
        </Button>
      </div>
      <ul className="list" style={{ listStyle: 'none', padding: 0 }}>
        {sortFields(fields).map((f) => (
          <li key={f.id} className="item">
            <span className="meta">
              <span className="t">
                {f.name}
                {isSystemField(f) && <Lock className="ic sm" aria-label="Campo base" style={{ marginLeft: 6, verticalAlign: 'middle' }} />}
              </span>
              {f.description && <span className="s">{f.description}</span>}
              <span className="tags" style={{ marginTop: 4 }}>
                <Badge>{TYPE_LABEL[f.type]}</Badge>
                {f.tts && <Badge><Volume2 className="ic sm" aria-hidden="true" />Audio</Badge>}
                <Badge tone={f.required ? 'ok' : 'neutral'}>{f.required ? 'Obligatorio' : 'Opcional'}</Badge>
              </span>
            </span>
            <IconButton aria-label={`Editar campo ${f.name}`} onClick={() => onEdit(f)}><Pencil className="ic" aria-hidden="true" /></IconButton>
          </li>
        ))}
      </ul>
      <p className="xs muted" style={{ marginTop: 'var(--sp-2)' }}>Para reordenar un campo usa “Mover” dentro de su editor.</p>
    </section>
  );
}
