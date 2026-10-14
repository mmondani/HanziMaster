import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { card, chinese } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

function seeded() {
  const repos = new MemoryRepositories();
  repos.languagesData = [chinese(), chinese({ id: 'ja', name: 'Japonés', code: 'ja-JP', tags: ['Saludos'], layouts: [] })];
  repos.flashcardsData = [
    card('c1', 'zh', { values: { word: '你好', translation: 'hola', pinyin: 'nǐ hǎo' }, tags: ['Saludos'] }),
    card('c2', 'zh', { values: { word: '谢谢', translation: 'gracias', pinyin: 'xièxie' }, tags: ['Saludos'] }),
    card('c3', 'zh', { values: { word: '学生', translation: 'estudiante', pinyin: 'xuésheng' }, tags: ['Escuela'] }),
    card('c4', 'zh', { values: { word: '水', translation: 'agua', pinyin: 'shuǐ' }, tags: [] }),
    card('j1', 'ja', { values: { word: 'こんにちは', translation: 'hola' }, tags: ['Saludos'] }),
  ];
  return repos;
}

async function openList(repos = seeded(), path = '/flashcards') {
  const view = renderApp(path, signedInService(), repos);
  await screen.findByRole('heading', { name: 'Flashcards', level: 1 });
  // Espera a que terminen de cargar los datos (desaparece el esqueleto).
  await waitFor(() => expect(screen.queryByRole('status', { name: 'Cargando flashcards' })).toBeNull());
  return { ...view, repos };
}

const rows = () => within(screen.getByRole('main')).queryAllByRole('link', { name: /Saludos|Escuela|hola|gracias|estudiante|agua|こんにちは/ }).filter((a) => a.classList.contains('card-row'));

describe('F01 · Listado de flashcards', () => {
  it('F01-1 muestra solo las flashcards del idioma seleccionado con palabra, traducción y tags', async () => {
    await openList();
    expect(await screen.findByText('你好')).toBeInTheDocument();
    expect(screen.getByText('4 flashcards')).toBeInTheDocument();
    expect(screen.queryByText('こんにちは')).toBeNull();
    const row = screen.getByRole('link', { name: /你好/ });
    expect(row).toHaveTextContent('hola');
    expect(row).toHaveTextContent('Saludos');
    expect(rows()).toHaveLength(4);
  });

  it('F01-2 la búsqueda filtra en vivo por palabra o traducción, sin distinguir mayúsculas ni acentos', async () => {
    const { router } = await openList();
    await screen.findByLabelText('Buscar flashcards');
    await userEvent.type(screen.getByLabelText('Buscar flashcards'), 'ESTUDIÁ');
    await waitFor(() => expect(screen.getByText('1 flashcard')).toBeInTheDocument());
    expect(rows()).toHaveLength(1);
    expect(router.state.location.search).toBe('?q=ESTUDI%C3%81');
    await userEvent.clear(screen.getByLabelText('Buscar flashcards'));
    await userEvent.type(screen.getByLabelText('Buscar flashcards'), '谢');
    expect(await screen.findByRole('link', { name: /谢谢/ })).toBeInTheDocument();
    expect(screen.getByText('1 flashcard')).toBeInTheDocument();
  });

  it('F01-2 abrir la URL con ?q= aplica la búsqueda', async () => {
    await openList(seeded(), '/flashcards?q=agua');
    await waitFor(() => expect(screen.getByText('1 flashcard')).toBeInTheDocument());
    expect(screen.getByLabelText('Buscar flashcards')).toHaveValue('agua');
  });

  it('F01-3 elegir un tag muestra solo las flashcards con ese tag; "Todas" restaura la lista', async () => {
    const { router } = await openList();
    const group = screen.getByRole('group', { name: 'Filtrar por tag' });
    await userEvent.click(within(group).getByRole('button', { name: 'Escuela' }));
    expect(screen.getByText('1 flashcard')).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: 'Escuela' })).toHaveAttribute('aria-pressed', 'true');
    expect(router.state.location.search).toBe('?tag=Escuela');
    await userEvent.click(within(group).getByRole('button', { name: 'Todas' }));
    expect(screen.getByText('4 flashcards')).toBeInTheDocument();
  });

  it('F01-4 cambiar de idioma actualiza la lista, limpia filtros y se conserva al volver', async () => {
    const { router } = await openList(seeded(), '/flashcards?tag=Escuela');
    await userEvent.click(await screen.findByRole('button', { name: /Idioma: Chino mandarín/ }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Japonés' }));
    expect(await screen.findByText('こんにちは')).toBeInTheDocument();
    expect(screen.queryByText('你好')).toBeNull();
    expect(router.state.location.search).toBe('');
    await router.navigate('/mazos');
    await screen.findByRole('heading', { name: 'Mazos', level: 1 });
    await router.navigate('/flashcards');
    expect(await screen.findByText('こんにちは')).toBeInTheDocument();
    expect(localStorage.getItem('hm:active-language:u1')).toBe('ja');
  });

  it('el selector de idioma ofrece "Administrar idiomas" y se opera con teclado', async () => {
    const { router } = await openList();
    await userEvent.click(await screen.findByRole('button', { name: /Idioma: Chino mandarín/ }));
    expect(screen.getByRole('menuitemradio', { name: 'Chino mandarín' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Administrar idiomas' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(await screen.findByRole('button', { name: /Idioma: Chino mandarín/ })).toHaveFocus();
    await userEvent.click(await screen.findByRole('button', { name: /Idioma: Chino mandarín/ }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Administrar idiomas' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/idiomas'));
  });

  it('F01-5 una búsqueda sin coincidencias muestra "Sin resultados" con acción para limpiar', async () => {
    await openList();
    await screen.findByLabelText('Buscar flashcards');
    await userEvent.type(screen.getByLabelText('Buscar flashcards'), 'xyz');
    expect(await screen.findByText('Sin resultados para “xyz”')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    expect(await screen.findByText('4 flashcards')).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar flashcards')).toHaveValue('');
  });

  it('F01-6 un idioma sin flashcards muestra el estado vacío con acceso a crear', async () => {
    const repos = seeded();
    repos.flashcardsData = [];
    await openList(repos);
    expect(await screen.findByText('Todavía no hay flashcards en Chino mandarín')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Nueva flashcard/ }).length).toBeGreaterThan(0);
  });

  it('F01-7 tocar una fila abre el detalle de esa flashcard', async () => {
    const { router } = await openList();
    await userEvent.click(await screen.findByRole('link', { name: /学生/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/flashcards/c3'));
  });

  it('F01-8 el listado es navegable con teclado (filas y chips son enlaces/botones)', async () => {
    const { router } = await openList();
    const first = await screen.findByRole('link', { name: /你好/ });
    first.focus();
    expect(first).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/flashcards/c1'));
  });

  it('sin idiomas lleva a crear el primero', async () => {
    await openList(new MemoryRepositories());
    expect(await screen.findByText('Primero configura un idioma')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Nuevo idioma/ })).toHaveAttribute('href', '/idiomas/nuevo');
  });

  it('muestra el error de carga con Reintentar', async () => {
    const repos = seeded();
    repos.languagesError = new Error('x');
    renderApp('/flashcards', signedInService(), repos);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar las flashcards');
    repos.languagesError = null;
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('你好')).toBeInTheDocument();
  });

  it('con muchas flashcards pagina de a 50 con el paginador numerado', async () => {
    const repos = seeded();
    repos.flashcardsData = Array.from({ length: 120 }, (_, i) => card(`n${i}`, 'zh', { values: { word: `字${i}`, translation: `t${i}` } }));
    await openList(repos);
    await screen.findByText('120 flashcards');
    expect(rows()).toHaveLength(50);
    await userEvent.click(screen.getByRole('button', { name: 'Página 2' }));
    expect(rows()).toHaveLength(50);
    await userEvent.click(screen.getByRole('button', { name: 'Página 3' }));
    expect(rows()).toHaveLength(20);
    expect(screen.queryByRole('button', { name: /Mostrar más/ })).toBeNull();
  });
});
