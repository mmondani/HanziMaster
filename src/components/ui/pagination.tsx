import { ChevronLeft, ChevronRight } from 'lucide-react';
import { pageSlots } from '@/lib/domain/list-view';

export interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

/** Paginador numerado (1 2 3 … 5). No se muestra si hay una sola página. */
export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav className="pagination" aria-label="Paginación">
      <button type="button" className="page-btn" aria-label="Página anterior" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="ic" aria-hidden="true" />
      </button>
      <ol className="page-list">
        {pageSlots(page, pageCount).map((slot, i) => (
          <li key={slot === 'gap' ? `gap-${i}` : slot}>
            {slot === 'gap' ? (
              <span className="page-gap" aria-hidden="true">…</span>
            ) : (
              <button
                type="button"
                className={`page-btn${slot === page ? ' current' : ''}`}
                aria-label={`Página ${slot}`}
                aria-current={slot === page ? 'page' : undefined}
                onClick={() => onChange(slot)}
              >
                {slot}
              </button>
            )}
          </li>
        ))}
      </ol>
      <button type="button" className="page-btn" aria-label="Página siguiente" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        <ChevronRight className="ic" aria-hidden="true" />
      </button>
    </nav>
  );
}
