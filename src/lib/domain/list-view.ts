/** Orden de los listados por fecha de creación. */
export type SortOrder = 'recent' | 'oldest';

export const DEFAULT_ORDER: SortOrder = 'recent';

/** Valores de `?orden=` en la URL. */
const ORDER_PARAM: Record<SortOrder, string> = { recent: 'recientes', oldest: 'antiguas' };

export const ORDER_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'recent', label: 'Más recientes primero' },
  { value: 'oldest', label: 'Más antiguas primero' },
];

export function parseOrder(param: string | null): SortOrder {
  return (Object.keys(ORDER_PARAM) as SortOrder[]).find((o) => ORDER_PARAM[o] === param) ?? DEFAULT_ORDER;
}

/** `null` para el orden por defecto, así no ensucia la URL. */
export function orderParam(order: SortOrder): string | null {
  return order === DEFAULT_ORDER ? null : ORDER_PARAM[order];
}

/**
 * Ordena por `createdAt` sin modificar la lista original. Lo que no tiene fecha (mazos anteriores
 * a esta iteración) cuenta como lo más antiguo; los empates conservan su orden.
 */
export function sortByCreated<T extends { createdAt?: number }>(items: readonly T[], order: SortOrder): T[] {
  const sign = order === 'recent' ? -1 : 1;
  return [...items].sort((a, b) => sign * ((a.createdAt ?? 0) - (b.createdAt ?? 0)));
}

export interface Page<T> {
  items: T[];
  /** Página efectiva (1-based), ya corregida al rango válido. */
  page: number;
  pageCount: number;
}

/** Recorta una página de la lista; una página fuera de rango se corrige a la más cercana. */
export function paginate<T>(items: readonly T[], page: number, size: number): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Number.isFinite(page) ? Math.min(Math.max(Math.trunc(page), 1), pageCount) : 1;
  return { items: items.slice((current - 1) * size, current * size), page: current, pageCount };
}

/** Valor de `?pagina=`: inválido o menor que 1 equivale a la primera página. */
export function parsePage(param: string | null): number {
  const n = Number.parseInt(param ?? '', 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export type PageSlot = number | 'gap';

/** Números a mostrar: siempre la primera y la última, la actual y sus vecinas, con "…" en los saltos. */
export function pageSlots(page: number, pageCount: number): PageSlot[] {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1]);
  const numbers = [...wanted].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  const slots: PageSlot[] = [];
  numbers.forEach((n, i) => {
    const prev = numbers[i - 1];
    if (prev !== undefined && n - prev === 2) slots.push(prev + 1);
    else if (prev !== undefined && n - prev > 2) slots.push('gap');
    slots.push(n);
  });
  return slots;
}
