import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { cellGrid, toCanvas, type Point } from '@/lib/domain/strokes';
import type { CharDataLoader } from '@/lib/handwriting/char-data';
import { CharDataProvider } from '@/lib/handwriting/char-data-provider';
import { fixtureLoader, strokeData } from '@/test/stroke-fixtures';
import { HandwritingCanvas } from './handwriting-canvas';

const WIDTH = 600;
const zh = { code: 'zh-CN' };

beforeEach(() => {
  // jsdom no hace layout: el contenedor del canvas mide WIDTH (sin matchMedia, las celdas van en fila).
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(WIDTH);
});

afterEach(() => vi.restoreAllMocks());

function setup(word: string, loader: CharDataLoader = fixtureLoader(), paged = false) {
  render(
    <CharDataProvider loader={loader}>
      <HandwritingCanvas language={zh} word={word} />
    </CharDataProvider>,
  );
  const cells = cellGrid([...word].length, WIDTH, { paged }).cells;
  const canvas = screen.getByRole('img', { name: /Área de dibujo/ });
  /** Dibuja un trazo (en unidades de la celda) en la celda `cell`. */
  const draw = (cell: number, points: Point[], pointerId = 1) => {
    const px = points.map((p) => toCanvas(p, cells[cell]));
    fireEvent.pointerDown(canvas, { pointerId, button: 0, clientX: px[0].x, clientY: px[0].y });
    for (const p of px.slice(1)) fireEvent.pointerMove(canvas, { pointerId, clientX: p.x, clientY: p.y });
    fireEvent.pointerUp(canvas, { pointerId, clientX: px.at(-1)!.x, clientY: px.at(-1)!.y });
  };
  /** Escribe el carácter con sus propios trazos (o los elegidos). */
  const write = (cell: number, char: string, pick?: (strokes: Point[][]) => Point[][]) => {
    const strokes = strokeData(char).medians;
    for (const s of pick ? pick(strokes) : strokes) draw(cell, s);
  };
  /** Toca (con un temblor de 3 px, menos que lo que cuenta como trazo) en un punto de la celda. */
  const tap = (cell: number, point: Point) => {
    const p = toCanvas(point, cells[cell]);
    fireEvent.pointerDown(canvas, { pointerId: 9, button: 0, clientX: p.x, clientY: p.y });
    fireEvent.pointerMove(canvas, { pointerId: 9, clientX: p.x + 3, clientY: p.y });
    fireEvent.pointerUp(canvas, { pointerId: 9, clientX: p.x + 3, clientY: p.y });
  };
  return { canvas, draw, write, tap };
}

const button = (name: string) => screen.getByRole('button', { name });
const validate = () => userEvent.click(button('Validar'));

describe('E2 · Un único canvas para dibujar a mano alzada', () => {
  it('un solo canvas con una celda por carácter de la palabra', () => {
    setup('你好');
    expect(document.querySelectorAll('canvas')).toHaveLength(1);
    expect(screen.getByRole('img')).toHaveAccessibleName('Área de dibujo: 2 celdas, una por carácter');
  });

  it('una palabra sin caracteres para dibujar lo avisa', () => {
    render(<HandwritingCanvas language={zh} word="OK" />);
    expect(screen.getByText('Esta flashcard no tiene caracteres para dibujar.')).toBeInTheDocument();
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('el área de dibujo no gira la carta ni cuenta para el swipe', () => {
    setup('你');
    const area = document.querySelector('.hw')!;
    expect(area).toHaveAttribute('data-no-flip');
    expect(area).toHaveAttribute('data-no-swipe');
  });

  it('sin trazos, deshacer, borrar y validar están deshabilitados', () => {
    setup('你');
    for (const name of ['Deshacer trazo', 'Borrar todo', 'Validar']) expect(button(name)).toBeDisabled();
  });
});

describe('E3 · Deshacer trazo a trazo', () => {
  it('deshacer quita el último trazo (un trazo de más deja de contar)', async () => {
    const { write, draw } = setup('口');
    write(0, '口');
    draw(0, [{ x: 100, y: 900 }, { x: 900, y: 100 }]);
    await userEvent.click(button('Deshacer trazo'));
    await validate();
    expect(await screen.findByRole('status')).toHaveTextContent('¡Correcto!');
  });

  it('deshaciendo todos los trazos vuelve al estado vacío', async () => {
    const { draw } = setup('口');
    draw(0, [{ x: 100, y: 100 }, { x: 500, y: 100 }]);
    draw(0, [{ x: 100, y: 300 }, { x: 500, y: 300 }]);
    await userEvent.click(button('Deshacer trazo'));
    expect(button('Deshacer trazo')).toBeEnabled();
    await userEvent.click(button('Deshacer trazo'));
    expect(button('Deshacer trazo')).toBeDisabled();
    expect(button('Validar')).toBeDisabled();
  });
});

describe('Tocar un trazo lo borra', () => {
  it('tocar un trazo de más lo borra', async () => {
    const { write, draw, tap } = setup('口');
    write(0, '口');
    draw(0, [{ x: 100, y: 900 }, { x: 900, y: 100 }]);
    tap(0, { x: 500, y: 500 });
    await validate();
    expect(await screen.findByRole('status')).toHaveTextContent('¡Correcto!');
  });

  it('tocar fuera de los trazos no dibuja ni borra nada', async () => {
    const { write, tap } = setup('口');
    tap(0, { x: 500, y: 500 });
    expect(button('Deshacer trazo')).toBeDisabled();
    write(0, '口');
    tap(0, { x: 500, y: 500 });
    await validate();
    expect(await screen.findByRole('status')).toHaveTextContent('¡Correcto!');
  });

  it('borrar un trazo descarta el resultado de la validación', async () => {
    const { write, tap } = setup('口');
    write(0, '口');
    await validate();
    await screen.findByRole('status');
    const [first] = strokeData('口').medians;
    tap(0, first[Math.floor(first.length / 2)]);
    expect(screen.queryByRole('status')).toBeNull();
    await validate();
    expect(await screen.findByRole('status')).toHaveTextContent('Falta 1 trazo');
  });
});

describe('E4 · Borrar todo', () => {
  it('borra todos los trazos de todas las celdas', async () => {
    const { write } = setup('你好');
    write(0, '你');
    write(1, '好');
    await userEvent.click(button('Borrar todo'));
    for (const name of ['Deshacer trazo', 'Borrar todo', 'Validar']) expect(button(name)).toBeDisabled();
  });
});

describe('E5–E8 · Validar contra la palabra', () => {
  it('E5/E8 bien escrita: marca que está correcto', async () => {
    const { write } = setup('你好');
    write(0, '你');
    write(1, '好');
    await validate();
    const result = await screen.findByRole('status');
    expect(result).toHaveTextContent('¡Correcto!');
    expect(result).toHaveClass('correct');
    expect(result.querySelector('li')).toBeNull();
  });

  it('E6 el orden y la dirección de los trazos no importan', async () => {
    const { write } = setup('你好');
    write(0, '你', (s) => [...s].reverse());
    write(1, '好', (s) => s.map((stroke) => [...stroke].reverse()));
    await validate();
    expect(await screen.findByRole('status')).toHaveTextContent('¡Correcto!');
  });

  it('E6 cada trazo cuenta para el carácter de su celda', async () => {
    const { write } = setup('你好');
    // Los trazos de 你 en la celda de 好 y viceversa: ninguno está bien.
    write(0, '好');
    write(1, '你');
    await validate();
    expect(await screen.findByRole('status')).toHaveTextContent('Hay errores');
  });

  it('E7 con errores: lo indica; el detalle por carácter no se muestra (solo para lectores de pantalla)', async () => {
    const { write } = setup('你好');
    write(0, '你');
    write(1, '好', (s) => s.slice(0, -1));
    await validate();
    const result = await screen.findByRole('status');
    expect(result).toHaveTextContent('Hay errores: están marcados en rojo.');
    expect(result).toHaveClass('errors');
    expect(result.querySelectorAll('li')).toHaveLength(1);
    expect(result.querySelector('li')!.closest('ul')).toHaveClass('sr-only');
    expect(result).toHaveTextContent('Carácter 2: Falta 1 trazo');
  });

  it('E7 un trazo de más y una celda vacía', async () => {
    const { write, draw } = setup('你好');
    write(0, '你');
    draw(0, [{ x: 50, y: 980 }, { x: 980, y: 50 }]);
    await validate();
    const result = await screen.findByRole('status');
    expect(result).toHaveTextContent('Carácter 1: 1 trazo mal hecho o de más');
    expect(result).toHaveTextContent('Carácter 2: Faltan 6 trazos');
  });

  it('valida contra los datos de cada carácter de la palabra', async () => {
    const loader = fixtureLoader();
    const { write } = setup('你好', loader);
    write(0, '你');
    await validate();
    expect(loader.calls).toEqual(['你', '好']);
  });

  it('volver a dibujar descarta el resultado anterior', async () => {
    const { write, draw } = setup('口');
    write(0, '口');
    await validate();
    await screen.findByRole('status');
    draw(0, [{ x: 100, y: 100 }, { x: 600, y: 100 }]);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('un carácter sin datos de trazos no se puede validar y no cuenta como error', async () => {
    const { write, draw } = setup('口々');
    write(0, '口');
    draw(1, [{ x: 100, y: 100 }, { x: 600, y: 600 }]);
    await validate();
    const result = await screen.findByRole('status');
    expect(result).toHaveTextContent('¡Correcto!');
    expect(screen.getByText('Carácter 2: No se puede validar').closest('ul')).not.toHaveClass('sr-only');
  });

  it('si no se pueden descargar los trazos, lo avisa y se puede reintentar', async () => {
    let fail = true;
    const fixtures = fixtureLoader();
    const loader: CharDataLoader = { load: (ch, lang) => (fail ? Promise.reject(new Error('offline')) : fixtures.load(ch, lang)) };
    const { write } = setup('口', loader);
    write(0, '口');
    await validate();
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron descargar los trazos');
    fail = false;
    await validate();
    expect(await screen.findByRole('status')).toHaveTextContent('¡Correcto!');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('Mobile · un carácter a la vez, sin scroll', () => {
  const original = window.matchMedia;
  beforeEach(() => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes('max-width'),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })) as unknown as typeof window.matchMedia;
  });
  afterEach(() => {
    window.matchMedia = original;
  });

  const page = (n: number, total: number) => screen.getByRole('button', { name: new RegExp(`^Carácter ${n} de ${total}`) });

  it('muestra una celda y los indicadores de cada carácter, sin revelar los caracteres', async () => {
    setup('你好', fixtureLoader(), true);
    expect(screen.getByRole('img')).toHaveAccessibleName('Área de dibujo: carácter 1 de 2');
    expect(page(1, 2)).toHaveAttribute('aria-current', 'true');
    expect(within(screen.getByRole('group', { name: 'Caracteres' })).queryByText(/[你好]/)).toBeNull();
    await userEvent.click(button('Carácter siguiente'));
    expect(screen.getByRole('img')).toHaveAccessibleName('Área de dibujo: carácter 2 de 2');
    expect(button('Carácter siguiente')).toBeDisabled();
    await userEvent.click(page(1, 2));
    expect(page(1, 2)).toHaveAttribute('aria-current', 'true');
  });

  it('swipe sobre los indicadores: a la izquierda el siguiente, a la derecha el anterior', () => {
    setup('你好学', fixtureLoader(), true);
    const strip = screen.getByRole('group', { name: 'Caracteres' }).parentElement!;
    const swipe = (from: number, to: number, dy = 0) => {
      fireEvent.pointerDown(page(1, 3), { pointerId: 5, clientX: from, clientY: 10 });
      fireEvent.pointerUp(page(1, 3), { pointerId: 5, clientX: to, clientY: 10 + dy });
      fireEvent.click(page(1, 3));
    };
    swipe(200, 100);
    expect(page(2, 3)).toHaveAttribute('aria-current', 'true');
    swipe(200, 100);
    swipe(200, 100);
    expect(page(3, 3)).toHaveAttribute('aria-current', 'true');
    swipe(100, 200);
    expect(page(2, 3)).toHaveAttribute('aria-current', 'true');
    // Corto o más vertical que horizontal: no es swipe (y el toque en el indicador 1 sí cuenta).
    swipe(200, 180);
    expect(page(1, 3)).toHaveAttribute('aria-current', 'true');
    swipe(200, 140, 90);
    expect(strip.querySelector('[aria-current]')).toBe(page(1, 3));
  });

  it('una palabra de un carácter no muestra indicadores', () => {
    setup('口', fixtureLoader(), true);
    expect(screen.queryByRole('group', { name: 'Caracteres' })).toBeNull();
    expect(screen.getByRole('img')).toHaveAccessibleName('Área de dibujo: una celda');
  });

  it('cada trazo va al carácter visible y los indicadores muestran el resultado', async () => {
    const { write } = setup('你好', fixtureLoader(), true);
    write(0, '你');
    expect(page(1, 2)).toHaveAccessibleName('Carácter 1 de 2, con trazos');
    await userEvent.click(button('Carácter siguiente'));
    write(0, '好');
    await validate();
    expect(await screen.findByRole('status')).toHaveTextContent('¡Correcto!');
    expect(page(1, 2)).toHaveAccessibleName('Carácter 1 de 2, correcto');
    expect(page(2, 2)).toHaveAccessibleName('Carácter 2 de 2, correcto');
  });

  it('deshacer quita el último trazo del carácter visible', async () => {
    const { write } = setup('你好', fixtureLoader(), true);
    write(0, '你');
    await userEvent.click(button('Carácter siguiente'));
    expect(button('Deshacer trazo')).toBeDisabled();
    write(0, '好');
    await userEvent.click(button('Carácter anterior'));
    await userEvent.click(button('Deshacer trazo'));
    await validate();
    const result = await screen.findByRole('status');
    expect(result).toHaveTextContent('Carácter 1: Falta 1 trazo');
    expect(result).not.toHaveTextContent('Carácter 2');
  });

  it('al validar con errores, muestra el primer carácter con errores', async () => {
    const { write } = setup('你好', fixtureLoader(), true);
    write(0, '你', (s) => s.slice(1));
    await userEvent.click(button('Carácter siguiente'));
    write(0, '好');
    await validate();
    await screen.findByRole('status');
    expect(page(1, 2)).toHaveAccessibleName('Carácter 1 de 2, con errores');
    expect(page(1, 2)).toHaveAttribute('aria-current', 'true');
  });
});
