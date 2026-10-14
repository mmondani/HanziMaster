import { Select } from '@/components/ui/select';
import { ORDER_OPTIONS, type SortOrder } from '@/lib/domain/list-view';

export interface SortSelectProps {
  value: SortOrder;
  onChange: (order: SortOrder) => void;
}

/** Selector del orden por fecha de creación de los listados. */
export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <Select className="sort-select" aria-label="Ordenar por fecha de creación" value={value} onChange={(e) => onChange(e.target.value as SortOrder)}>
      {ORDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </Select>
  );
}
