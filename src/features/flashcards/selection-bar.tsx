import { Link } from 'react-router-dom';
import { Layers, Pencil, X } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';

export interface SelectionBarProps {
  ids: string[];
  onEdit: () => void;
  onCancel: () => void;
}

/** F02 · Barra flotante de acciones sobre la selección: crear mazo, editar en masa, cancelar. */
export function SelectionBar({ ids, onEdit, onCancel }: SelectionBarProps) {
  const none = ids.length === 0;
  return (
    <div className="action-bar" role="toolbar" aria-label="Acciones sobre la selección">
      <span className="count" role="status" aria-live="polite">
        <span>{ids.length}</span>
        <span className="only-desktop"> seleccionadas</span>
        <span className="sr-only only-mobile"> seleccionadas</span>
      </span>
      {none ? (
        <button type="button" className="btn btn-light" disabled><Layers className="ic" aria-hidden="true" />Crear mazo</button>
      ) : (
        <Link className="btn btn-light" to={`/mazos/nuevo?cartas=${ids.join(',')}`}><Layers className="ic" aria-hidden="true" />Crear mazo</Link>
      )}
      <button type="button" className="btn btn-onbar" disabled={none} onClick={onEdit}><Pencil className="ic" aria-hidden="true" />Editar</button>
      <IconButton className="btn-onbar" style={{ color: 'var(--bg)' }} aria-label="Cancelar selección" onClick={onCancel}>
        <X className="ic" aria-hidden="true" />
      </IconButton>
    </div>
  );
}
