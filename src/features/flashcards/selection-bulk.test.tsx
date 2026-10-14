import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { card, chinese, deck } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

function seeded() {
  const repos = new MemoryRepositories();
  repos.languagesData = [chinese({ tags: ['Saludos', 'Escuela', 'HSK1'] })];
  repos.flashcardsData = [
    card('c1', 'zh', { values: { word: '你好', translation: 'hola', pinyin: 'nǐ hǎo' }, tags: ['Saludos'] }),
    card('c2', 'zh', { values: { word: '谢谢', translation: 'gracias', pinyin: 'xièxie' }, tags: ['Saludos', 'HSK1'] }),
    card('c3', 'zh', { values: { word: '学生', translation: 'estudiante', pinyin: 'xuésheng' }, tags: ['Escuela'] }),
    card('c4', 'zh', { values: { word: '水', translation: 'agua', pinyin: 'shuǐ' }, tags: [] }),
  ];
  return repos;
}

async function openList(repos = seeded()) {
  const view = renderApp('/flashcards', signedInService(), repos);
  await screen.findByRole('link', { name: /你好/ });
  return { ...view, repos };
}

const startSelecting = async () => userEvent.click(screen.getAllByRole('button', { name: 'Seleccionar' })[0]);
const row = (word: string) => screen.getByRole('checkbox', { name: new RegExp(word) });
const bar = () => screen.getByRole('toolbar', { name: 'Acciones sobre la selección' });

describe('F02 · Selección múltiple', () => {
  it('F02-1 Seleccionar activa el modo selección y muestra la barra con el contador', async () => {
    await openList();
    expect(screen.queryByRole('toolbar')).toBeNull();
    await startSelecting();
    expect(bar()).toBeInTheDocument();
    expect(within(bar()).getByRole('status')).toHaveTextContent('0 seleccionadas');
    expect(within(bar()).getByRole('button', { name: /Editar/ })).toBeDisabled();
    expect(within(bar()).getByRole('button', { name: /Crear mazo/ })).toBeDisabled();
    // El FAB (mobile) se oculta; queda solo el botón del encabezado (desktop).
    expect(document.querySelector('.fab')).toBeNull();
  });

  it('F02-2 tocar filas agrega y quita de la selección y actualiza el contador', async () => {
    const { router } = await openList();
    await startSelecting();
    await userEvent.click(row('你好'));
    await userEvent.click(row('学生'));
    expect(row('你好')).toHaveAttribute('aria-checked', 'true');
    expect(within(bar()).getByRole('status')).toHaveTextContent('2 seleccionadas');
    await userEvent.click(row('你好'));
    expect(row('你好')).toHaveAttribute('aria-checked', 'false');
    expect(within(bar()).getByRole('status')).toHaveTextContent('1 seleccionadas');
    await waitFor(() => expect(router.state.location.pathname).toBe('/flashcards'));
  });

  it('"Seleccionar todas las visibles" alterna la selección de las filas a la vista', async () => {
    await openList();
    await startSelecting();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar todas las visibles' }));
    expect(within(bar()).getByRole('status')).toHaveTextContent('4 seleccionadas');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar todas las visibles' }));
    expect(within(bar()).getByRole('status')).toHaveTextContent('0 seleccionadas');
  });

  it('la selección solo cuenta las flashcards que están a la vista (filtro)', async () => {
    await openList();
    await startSelecting();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar todas las visibles' }));
    await userEvent.click(within(screen.getByRole('group', { name: 'Filtrar por tag' })).getByRole('button', { name: 'Escuela' }));
    expect(within(bar()).getByRole('status')).toHaveTextContent('1 seleccionadas');
  });

  it('F02-3 Crear mazo abre M02 con las flashcards seleccionadas', async () => {
    const { router } = await openList();
    await startSelecting();
    await userEvent.click(row('你好'));
    await userEvent.click(row('水'));
    await userEvent.click(within(bar()).getByRole('link', { name: /Crear mazo/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/mazos/nuevo'));
    expect(router.state.location.search).toBe('?cartas=c1,c4');
  });

  it('F02-5 Cancelar limpia la selección y restaura las filas normales', async () => {
    await openList();
    await startSelecting();
    await userEvent.click(row('你好'));
    await userEvent.click(within(bar()).getByRole('button', { name: 'Cancelar selección' }));
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(screen.getByRole('link', { name: /你好/ })).toBeInTheDocument();
    await startSelecting();
    expect(within(bar()).getByRole('status')).toHaveTextContent('0 seleccionadas');
  });

  it('F02-5 Esc sale del modo selección', async () => {
    await openList();
    await startSelecting();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('en mobile "Seleccionar" está en el menú de más acciones', async () => {
    await openList();
    await userEvent.click(screen.getByRole('button', { name: 'Más acciones' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Seleccionar' }));
    expect(bar()).toBeInTheDocument();
  });
});

describe('F06 · Edición masiva', () => {
  async function openBulk(ids: string[], repos = seeded()) {
    const view = await openList(repos);
    await startSelecting();
    for (const id of ids) await userEvent.click(row(id));
    await userEvent.click(within(bar()).getByRole('button', { name: /Editar/ }));
    const dialog = await screen.findByRole('dialog');
    return { ...view, dialog: within(dialog) };
  }

  it('F02-4 / F06-3 Editar abre el diálogo indicando la cantidad de flashcards afectadas', async () => {
    const { dialog } = await openBulk(['你好', '谢谢', '学生']);
    expect(screen.getByRole('dialog', { name: 'Editar 3 flashcards' })).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: 'Aplicar a 3' })).toBeDisabled();
  });

  it('F06-1 permite elegir cualquier campo editable salvo Palabra y Traducción', async () => {
    const { dialog } = await openBulk(['你好']);
    const options = within(dialog.getByLabelText('Campo a modificar')).getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Pinyin', 'Tags']);
    expect(dialog.getByLabelText('Campo a modificar')).toHaveValue('tags');
  });

  it('F06-2 / F06-4 agrega un tag: el resumen cuenta cuántas cambian y al aplicar actualiza, sale de la selección y permite deshacer', async () => {
    const { dialog, repos } = await openBulk(['你好', '谢谢', '学生']);
    expect(dialog.getByRole('group', { name: 'Acción sobre los tags' })).toBeInTheDocument();
    await userEvent.click(within(dialog.getByRole('group', { name: 'Tags' })).getByRole('button', { name: 'HSK1' }));
    expect(dialog.getByText('Se agregará «HSK1» a 2 de las 3 flashcards seleccionadas.')).toBeInTheDocument();
    await userEvent.click(dialog.getByRole('button', { name: 'Aplicar a 3' }));
    await waitFor(() => expect(repos.flashcardsData.find((c) => c.id === 'c1')!.tags).toEqual(['Saludos', 'HSK1']));
    expect(repos.flashcardsData.find((c) => c.id === 'c3')!.tags).toEqual(['Escuela', 'HSK1']);
    expect(repos.flashcardsData.find((c) => c.id === 'c2')!.tags).toEqual(['Saludos', 'HSK1']);
    expect(repos.flashcardsData.find((c) => c.id === 'c4')!.tags).toEqual([]);
    expect(screen.queryByRole('toolbar')).toBeNull();
    expect(await screen.findByText('Se actualizaron 2 flashcards')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(() => expect(repos.flashcardsData.find((c) => c.id === 'c1')!.tags).toEqual(['Saludos']));
    expect(repos.flashcardsData.find((c) => c.id === 'c3')!.tags).toEqual(['Escuela']);
  });

  it('F06-2 quita y reemplaza tags', async () => {
    const first = await openBulk(['你好', '谢谢']);
    await userEvent.click(first.dialog.getByRole('button', { name: 'Quitar' }));
    await userEvent.click(within(first.dialog.getByRole('group', { name: 'Tags' })).getByRole('button', { name: 'Saludos' }));
    expect(first.dialog.getByText('Se quitará «Saludos» de las 2 flashcards seleccionadas.')).toBeInTheDocument();
    await userEvent.click(first.dialog.getByRole('button', { name: 'Aplicar a 2' }));
    await waitFor(() => expect(first.repos.flashcardsData.find((c) => c.id === 'c1')!.tags).toEqual([]));
    expect(first.repos.flashcardsData.find((c) => c.id === 'c2')!.tags).toEqual(['HSK1']);
  });

  it('F06-2 reemplazar por ningún tag los quita todos', async () => {
    const { dialog, repos } = await openBulk(['谢谢', '学生']);
    await userEvent.click(dialog.getByRole('button', { name: 'Reemplazar' }));
    expect(dialog.getByText('Se quitarán todos los tags de las 2 flashcards seleccionadas.')).toBeInTheDocument();
    await userEvent.click(dialog.getByRole('button', { name: 'Aplicar a 2' }));
    await waitFor(() => expect(repos.flashcardsData.find((c) => c.id === 'c2')!.tags).toEqual([]));
    expect(repos.flashcardsData.find((c) => c.id === 'c3')!.tags).toEqual([]);
  });

  it('F06-1 permite crear un tag nuevo y asignarlo', async () => {
    const { dialog, repos } = await openBulk(['水']);
    await userEvent.type(dialog.getByLabelText(/Nuevo tag/), 'Viajes');
    await userEvent.click(dialog.getByRole('button', { name: 'Crear' }));
    await waitFor(() => expect(repos.languagesData[0].tags).toContain('Viajes'));
    expect(await dialog.findByRole('button', { name: 'Viajes' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(dialog.getByRole('button', { name: 'Aplicar a 1' }));
    await waitFor(() => expect(repos.flashcardsData.find((c) => c.id === 'c4')!.tags).toEqual(['Viajes']));
  });

  it('F06-1 edita otro campo con un input del tipo del campo', async () => {
    const { dialog, repos } = await openBulk(['你好', '水']);
    await userEvent.selectOptions(dialog.getByLabelText('Campo a modificar'), 'pinyin');
    await userEvent.type(dialog.getByLabelText(/Nuevo valor/), 'pendiente');
    expect(dialog.getByText(/pasará a valer «pendiente»/)).toBeInTheDocument();
    await userEvent.click(dialog.getByRole('button', { name: 'Aplicar a 2' }));
    await waitFor(() => expect(repos.flashcardsData.find((c) => c.id === 'c1')!.values.pinyin).toBe('pendiente'));
    expect(repos.flashcardsData.find((c) => c.id === 'c4')!.values.pinyin).toBe('pendiente');
    expect(repos.flashcardsData.find((c) => c.id === 'c2')!.values.pinyin).toBe('xièxie');
  });

  it('F06-5 Cancelar o cerrar no modifica nada', async () => {
    const { dialog, repos } = await openBulk(['你好']);
    await userEvent.click(within(dialog.getByRole('group', { name: 'Tags' })).getByRole('button', { name: 'Escuela' }));
    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(repos.flashcardsData.find((c) => c.id === 'c1')!.tags).toEqual(['Saludos']);
    expect(bar()).toBeInTheDocument();
    await userEvent.click(within(bar()).getByRole('button', { name: /Editar/ }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(repos.flashcardsData.find((c) => c.id === 'c1')!.tags).toEqual(['Saludos']);
  });
});

describe('MJ6 · Eliminar la selección', () => {
  function seededWithDeck() {
    const repos = seeded();
    repos.decksData = [deck('d1', 'zh', { cardIds: ['c1', 'c2', 'c3'] })];
    return repos;
  }

  it('MJ6-1 el botón Eliminar está deshabilitado sin selección', async () => {
    await openList();
    await startSelecting();
    expect(within(bar()).getByRole('button', { name: /Eliminar/ })).toBeDisabled();
    await userEvent.click(row('你好'));
    expect(within(bar()).getByRole('button', { name: /Eliminar/ })).toBeEnabled();
  });

  it('MJ6-2 pide confirmación con la cantidad y Cancelar no borra nada', async () => {
    const { repos } = await openList(seededWithDeck());
    await startSelecting();
    await userEvent.click(row('你好'));
    await userEvent.click(row('谢谢'));
    await userEvent.click(within(bar()).getByRole('button', { name: /Eliminar/ }));
    const dialog = screen.getByRole('alertdialog', { name: '¿Eliminar 2 flashcards?' });
    expect(within(dialog).getByRole('button', { name: 'Eliminar 2 flashcards' })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(repos.flashcardsData).toHaveLength(4);
    expect(within(bar()).getByRole('status')).toHaveTextContent('2 seleccionadas');
  });

  it('MJ6-3 confirmar elimina las flashcards, las quita de los mazos y sale del modo selección', async () => {
    const { repos } = await openList(seededWithDeck());
    await startSelecting();
    await userEvent.click(row('你好'));
    await userEvent.click(row('学生'));
    await userEvent.click(within(bar()).getByRole('button', { name: /Eliminar/ }));
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar 2 flashcards' }));
    await waitFor(() => expect(repos.flashcardsData.map((c) => c.id)).toEqual(['c2', 'c4']));
    expect(repos.decksData[0].cardIds).toEqual(['c2']);
    await waitFor(() => expect(screen.queryByRole('toolbar')).toBeNull());
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.queryByRole('link', { name: /你好/ })).toBeNull();
    expect(await screen.findByText('Se eliminaron 2 flashcards')).toBeInTheDocument();
  });

  it('MJ6-4 con la selección de todas las visibles elimina todo lo filtrado y nada más', async () => {
    const { repos } = await openList(seededWithDeck());
    await startSelecting();
    await userEvent.click(within(screen.getByRole('group', { name: 'Filtrar por tag' })).getByRole('button', { name: 'Saludos' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Seleccionar todas las visibles' }));
    await userEvent.click(within(bar()).getByRole('button', { name: /Eliminar/ }));
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar 2 flashcards' }));
    await waitFor(() => expect(repos.flashcardsData.map((c) => c.id)).toEqual(['c3', 'c4']));
  });
});

describe('FX · Pulsación larga en una flashcard', () => {
  it('FX3 mantener apretada una fila (touch) entra en modo selección con esa carta marcada', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await openList();
      fireEvent.pointerDown(screen.getByRole('link', { name: /谢谢/ }), { pointerType: 'touch', clientX: 5, clientY: 5 });
      act(() => { vi.advanceTimersByTime(600); });
      expect(await screen.findByRole('toolbar', { name: 'Acciones sobre la selección' })).toBeInTheDocument();
      expect(within(bar()).getByRole('status')).toHaveTextContent('1 seleccionadas');
      expect(row('谢谢')).toBeChecked();
      expect(row('你好')).not.toBeChecked();
    } finally {
      vi.useRealTimers();
    }
  });

  it('FX4 un toque corto sigue abriendo el detalle', async () => {
    await openList();
    await userEvent.click(screen.getByRole('link', { name: /谢谢/ }));
    expect(await screen.findByRole('heading', { name: 'Flashcard' })).toBeInTheDocument();
    expect(screen.queryByRole('toolbar')).toBeNull();
  });
});
