import { orderParam, pageSlots, paginate, parseOrder, parsePage, sortByCreated } from './list-view';

const items = [{ id: 'b', createdAt: 20 }, { id: 'a', createdAt: 10 }, { id: 'old' }, { id: 'c', createdAt: 30 }];
const ids = (list: { id: string }[]) => list.map((i) => i.id);

describe('MJ1 · orden por fecha de creación', () => {
  it('MJ1-1 "recent" pone primero lo más nuevo y no modifica la lista original', () => {
    expect(ids(sortByCreated(items, 'recent'))).toEqual(['c', 'b', 'a', 'old']);
    expect(ids(items)).toEqual(['b', 'a', 'old', 'c']);
  });

  it('MJ1-2 "oldest" invierte el orden', () => {
    expect(ids(sortByCreated(items, 'oldest'))).toEqual(['old', 'a', 'b', 'c']);
  });

  it('MJ1-3 los elementos sin fecha cuentan como los más antiguos y los empates conservan su orden', () => {
    const tie = [{ id: 'x', createdAt: 5 }, { id: 'y', createdAt: 5 }, { id: 'z' }, { id: 'w' }];
    expect(ids(sortByCreated(tie, 'recent'))).toEqual(['x', 'y', 'z', 'w']);
  });

  it('el parámetro de la URL se interpreta y el valor por defecto no se escribe', () => {
    expect(parseOrder('antiguas')).toBe('oldest');
    expect(parseOrder('recientes')).toBe('recent');
    expect(parseOrder('cualquiera')).toBe('recent');
    expect(parseOrder(null)).toBe('recent');
    expect(orderParam('recent')).toBeNull();
    expect(orderParam('oldest')).toBe('antiguas');
  });
});

describe('MJ2 · paginación', () => {
  const list = Array.from({ length: 25 }, (_, i) => i + 1);

  it('MJ2-1 recorta la página pedida y calcula el total de páginas', () => {
    expect(paginate(list, 1, 10)).toEqual({ items: list.slice(0, 10), page: 1, pageCount: 3 });
    expect(paginate(list, 3, 10)).toEqual({ items: [21, 22, 23, 24, 25], page: 3, pageCount: 3 });
  });

  it('MJ2-2 una página fuera de rango se corrige y una lista vacía tiene una sola página', () => {
    expect(paginate(list, 99, 10).page).toBe(3);
    expect(paginate(list, 0, 10).page).toBe(1);
    expect(paginate(list, Number.NaN, 10).page).toBe(1);
    expect(paginate([], 4, 10)).toEqual({ items: [], page: 1, pageCount: 1 });
  });

  it('MJ2-3 pageSlots muestra primera, última, actual y vecinas con saltos', () => {
    expect(pageSlots(1, 1)).toEqual([1]);
    expect(pageSlots(1, 5)).toEqual([1, 2, 'gap', 5]);
    expect(pageSlots(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageSlots(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10]);
    expect(pageSlots(10, 10)).toEqual([1, 'gap', 9, 10]);
  });

  it('parsePage tolera valores inválidos', () => {
    expect(parsePage('3')).toBe(3);
    expect(parsePage('0')).toBe(1);
    expect(parsePage('x')).toBe(1);
    expect(parsePage(null)).toBe(1);
  });
});
