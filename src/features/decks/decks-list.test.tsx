import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { card, chinese, deck, MODE_A, MODE_B } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

function seeded() {
  const repos = new MemoryRepositories();
  repos.languagesData = [chinese(), chinese({ id: 'ja', name: 'Japonés', code: 'ja-JP', tags: [], layouts: [] })];
  repos.flashcardsData = [card('c1', 'zh'), card('c2', 'zh'), card('j1', 'ja')];
  repos.decksData = [
    deck('d1', 'zh', { name: 'Saludos básicos', cardIds: ['c1', 'c2'], modes: [MODE_A, MODE_B] }),
    deck('d2', 'zh', { name: 'HSK 1', cardIds: ['c1'], modes: [MODE_A] }),
    deck('d3', 'zh', { name: 'Vacío', cardIds: [], modes: [MODE_A] }),
    deck('d4', 'zh', { name: 'Frases útiles', cardIds: ['c1'], modes: [{ ...MODE_A, frontLayoutId: 'borrado' }] }),
    deck('dj', 'ja', { name: 'Hiragana', cardIds: ['j1'], modes: [] }),
  ];
  return repos;
}

async function openDecks(repos = seeded(), path = '/mazos') {
  const view = renderApp(path, signedInService(), repos);
  await screen.findByRole('heading', { name: 'Mazos', level: 1 });
  return { ...view, repos };
}

const cardOf = (name: string) => screen.getByRole('heading', { name }).closest('.deck-card') as HTMLElement;

describe('M01 · Listado de mazos', () => {
  it('M01-1 lista solo los mazos del idioma seleccionado con nombre, cantidad de cartas y modos', async () => {
    await openDecks();
    expect(await screen.findByText('Saludos básicos')).toBeInTheDocument();
    expect(screen.queryByText('Hiragana')).toBeNull();
    const first = within(cardOf('Saludos básicos'));
    expect(first.getByText('2 flashcards')).toBeInTheDocument();
    expect(first.getByText('2 modos de recorrida')).toBeInTheDocument();
    expect(first.getByText('Libre')).toBeInTheDocument();
    expect(within(cardOf('HSK 1')).getByText('1 flashcard')).toBeInTheDocument();
    expect(within(cardOf('HSK 1')).getByText('1 modo de recorrida')).toBeInTheDocument();
    expect(screen.getByText('4 mazos')).toBeInTheDocument();
  });

  it('M01-2 Estudiar abre la selección de modo de ese mazo', async () => {
    await openDecks();
    await userEvent.click(within(await screen.findByRole('heading', { name: 'Saludos básicos' }).then((h) => h.closest('.deck-card') as HTMLElement)).getByRole('button', { name: /Estudiar/ }));
    const dialog = screen.getByRole('dialog', { name: 'Saludos básicos · ¿Cómo recorrerlo?' });
    expect(within(dialog).getAllByRole('radio')).toHaveLength(2);
  });

  it('M01-2 con un único modo se inicia directamente, sin diálogo', async () => {
    const { router } = await openDecks();
    await userEvent.click(within(await screen.findByRole('heading', { name: 'HSK 1' }).then((h) => h.closest('.deck-card') as HTMLElement)).getByRole('button', { name: /Estudiar/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(router.state.location.pathname).toBe('/mazos/d2/estudiar'));
    expect(router.state.location.search).toBe('?modo=mA');
  });

  it('M01-3 el ícono de detalle abre M03 y Nuevo mazo abre M02', async () => {
    const { router } = await openDecks();
    await userEvent.click(await screen.findByRole('link', { name: 'Ver detalle de Saludos básicos' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/mazos/d1'));
    await userEvent.click(await screen.findByRole('button', { name: 'Volver a Mazos' }));
    await userEvent.click((await screen.findAllByRole('link', { name: /Nuevo mazo/ }))[0]);
    await waitFor(() => expect(router.state.location.pathname).toBe('/mazos/nuevo'));
  });

  it('tocar la tarjeta no inicia el estudio', async () => {
    const { router } = await openDecks();
    await userEvent.click(await screen.findByRole('heading', { name: 'Saludos básicos' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/mazos'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('M01-4 cambiar de idioma actualiza la lista', async () => {
    await openDecks();
    await userEvent.click(await screen.findByRole('button', { name: /Idioma: Chino mandarín/ }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Japonés' }));
    expect(await screen.findByText('Hiragana')).toBeInTheDocument();
    expect(screen.queryByText('Saludos básicos')).toBeNull();
  });

  it('M01-5 un idioma sin mazos muestra el estado vacío con acción para crear', async () => {
    const repos = seeded();
    repos.decksData = [];
    await openDecks(repos);
    expect(await screen.findByText('Aún no hay mazos en Chino mandarín')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Crear mazo/ })).toHaveAttribute('href', '/mazos/nuevo');
  });

  it('M01-6 un mazo sin flashcards no permite iniciar el recorrido', async () => {
    await openDecks();
    const empty = within(await screen.findByRole('heading', { name: 'Vacío' }).then((h) => h.closest('.deck-card') as HTMLElement));
    expect(empty.getByText('Sin flashcards')).toBeInTheDocument();
    expect(empty.getByRole('button', { name: /Estudiar/ })).toBeDisabled();
  });

  it('M01-7 un mazo cuyo layout fue eliminado se muestra como no disponible y no se puede estudiar', async () => {
    await openDecks();
    const broken = within(await screen.findByRole('heading', { name: 'Frases útiles' }).then((h) => h.closest('.deck-card') as HTMLElement));
    expect(broken.getByText('Mazo no disponible.')).toBeInTheDocument();
    expect(broken.getByRole('button', { name: /Estudiar/ })).toBeDisabled();
    expect(broken.getByRole('link', { name: 'Ver detalle de Frases útiles' })).toBeInTheDocument();
  });

  it('buscar por nombre filtra la lista', async () => {
    await openDecks();
    await userEvent.type(await screen.findByLabelText('Buscar mazos'), 'hsk');
    expect(screen.getByText('1 mazo')).toBeInTheDocument();
    expect(screen.queryByText('Saludos básicos')).toBeNull();
    await userEvent.clear(screen.getByLabelText('Buscar mazos'));
    await userEvent.type(screen.getByLabelText('Buscar mazos'), 'zzz');
    expect(screen.getByText('Sin resultados para “zzz”')).toBeInTheDocument();
  });

  it('sin idiomas lleva a crear el primero y un error permite reintentar', async () => {
    await openDecks(new MemoryRepositories());
    expect(await screen.findByText('Primero configura un idioma')).toBeInTheDocument();
  });

  it('muestra el error de carga con Reintentar', async () => {
    const repos = seeded();
    repos.languagesError = new Error('x');
    renderApp('/mazos', signedInService(), repos);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar los mazos');
  });
});
