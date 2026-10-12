import type { CSSProperties } from 'react';
import { GRID_COLUMNS, usedRows } from '@/lib/domain/layout-grid';
import type { FieldDef, LayoutItem, TextAlign, TextSize } from '@/lib/types';

const FONT_SIZE: Record<TextSize, number> = { S: 12, M: 14, L: 20, XL: 32 };
const JUSTIFY: Record<TextAlign, CSSProperties['justifyContent']> = { left: 'flex-start', center: 'center', right: 'flex-end' };

export interface LayoutCanvasProps {
  items: LayoutItem[];
  fields: FieldDef[];
  /** Con `onSelect` las celdas son botones (editor); sin él es solo lectura (miniaturas). */
  selectedFieldId?: string | null;
  onSelect?: (fieldId: string) => void;
  /** Miniatura: filas bajas y texto fijo. */
  compact?: boolean;
  /** Filas mínimas a mostrar (el editor muestra espacio libre debajo del contenido). */
  minRows?: number;
  label: string;
}

function describe(item: LayoutItem, name: string, selected: boolean) {
  const cols = item.colSpan === 1 ? `columna ${item.col}` : `columnas ${item.col} a ${item.col + item.colSpan - 1}`;
  const rows = item.rowSpan === 1 ? `fila ${item.row}` : `filas ${item.row} a ${item.row + item.rowSpan - 1}`;
  return `${name}, ${cols}, ${rows}${selected ? '. Seleccionado' : ''}`;
}

/** Grilla de 6 columnas con los campos de un layout. Es la base del editor (I04) y de las miniaturas (I02). */
export function LayoutCanvas({ items, fields, selectedFieldId, onSelect, compact, minRows = 0, label }: LayoutCanvasProps) {
  const rows = Math.max(usedRows(items), minRows, 1);
  const free = usedRows(items) < rows ? usedRows(items) + 1 : null;
  const nameOf = (id: string) => fields.find((f) => f.id === id)?.name ?? id;

  const style: CSSProperties = compact
    ? { gridAutoRows: 20, pointerEvents: 'none', padding: 8, gap: 4 }
    : { gridAutoRows: 44, minHeight: rows * 44 };

  return (
    <div className="layout-canvas" role="group" aria-label={label} aria-hidden={compact || undefined} style={style}>
      {items.map((item) => {
        const selected = item.fieldId === selectedFieldId;
        const cellStyle: CSSProperties = {
          gridColumn: `${item.col} / span ${item.colSpan}`,
          gridRow: `${item.row} / span ${item.rowSpan}`,
          fontSize: compact ? 11 : FONT_SIZE[item.textSize],
          justifyContent: JUSTIFY[item.align],
          ...(selected ? { outline: '3px solid var(--ring)', outlineOffset: 1 } : null),
        };
        const name = nameOf(item.fieldId);
        return onSelect ? (
          <button
            key={item.fieldId}
            type="button"
            className="cell"
            style={cellStyle}
            aria-pressed={selected}
            aria-label={describe(item, name, selected)}
            onClick={() => onSelect(item.fieldId)}
          >
            {name}
          </button>
        ) : (
          <div key={item.fieldId} className="cell" style={cellStyle}>{name}</div>
        );
      })}
      {!compact && free !== null && (
        <div className="cell empty-cell" style={{ gridColumn: `1 / span ${GRID_COLUMNS}`, gridRow: `${free} / ${rows + 1}` }}>
          Espacio libre
        </div>
      )}
    </div>
  );
}
