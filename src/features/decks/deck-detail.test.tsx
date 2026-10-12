import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { card, chinese, deck, MODE_A, MODE_B } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

function seeded() {
  const repos = new MemoryRepositories();
  repos.languagesData = [chinese()];
  repos.flashcardsData = Array.from({ length: 14 }, (_, i) => card(`c${i}`, 'zh', { values: { word: `字${i}`, translation: `t${i}`, pinyin: `p${i}` } }));
  repos.decksData = [
    deck('d1', 'zh', { name: 'Saludos básicos', cardIds: repos.flashcardsData.map((c) => c.id), modes: [MODE_A, MODE_B] }),
    deck('d2', 'zh', { name: 'Roto', cardIds: ['c0'], modes: [{ ...MODE_A, backLayoutId: 'borrado' }] }),
    deck('d3', 'zh', { name: 'Vacío', cardIds: [], modes: [MODE_A] }),
  ];
  return repos;
}

async function openDetail(id = 'd1', repos = seeded()) {
  const view = renderApp(`/mazos/${id}`, signedInService(), repos);
  await screen.findByRole('region', { name: 'Resumen del mazo' });
  return { ...view, repos };
}

const summary = () => within(screen.getByRole('region', { name: 'Resumen del mazo' }));

describe('M03 · Detalle de mazo', () => {
  it('M03-1 muestra nombre, cantidad de cartas, idioma, modos de recorrida y forma de aprendizaje', async () => {
    await openDetail();
    expect(screen.getByRole('heading', { name: 'Saludos básicos', level: 1 })).toBeInTheDocument();
    expect(summary().getByText('14')).toBeInTheDocument();
    expect(summary().getByText('Chino mandarín')).toBeInTheDocument();
    expect(summary().getByText('Libre')).toBeInTheDocument();
    expect(summary().getByText('Palabra → Significado')).toBeInTheDocument();
    expect(summary().getByText('Significado → Palabra')).toBeInTheDocument();
  });

  it('M03-2 lista las flashcards del mazo y cada una abre su detalle', async () => {
    const { router } = await openDetail();
    const list = within(screen.getByRole('region', { name: 'Flashcards del mazo' }));
    expect(list.getAllByRole('link')).toHaveLength(10);
    await userEvent.click(list.getByRole('button', { name: 'Ver las 14 flashcards' }));
    expect(list.getAllByRole('link')).toHaveLength(14);
    await userEvent.click(list.getByRole('button', { name: 'Ver menos' }));
    expect(list.getAllByRole('link')).toHaveLength(10);
    await userEvent.click(list.getByRole('link', { name: /字3/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/flashcards/c3'));
  });

  it('M03-3 Editar abre M02 precargado', async () => {
    const { router } = await openDetail();
    await userEvent.click(screen.getAllByRole('link', { name: /Editar/ })[0]);
    await waitFor(() => expect(router.state.location.pathname).toBe('/mazos/d1/editar'));
    expect(await screen.findByLabelText(/Nombre/)).toHaveValue('Saludos básicos');
  });

  it('M03-3 Estudiar este mazo abre la selección de modo (M04)', async () => {
    await openDetail();
    await userEvent.click(screen.getByRole('button', { name: /Estudiar este mazo/ }));
    expect(screen.getByRole('dialog', { name: 'Saludos básicos · ¿Cómo recorrerlo?' })).toBeInTheDocument();
  });

  it('un mazo no disponible lo explica, enlaza a editarlo y no se puede estudiar', async () => {
    await openDetail('d2');
    expect(screen.getByText('Este mazo no está disponible:')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edítalo para elegir otro layout' })).toHaveAttribute('href', '/mazos/d2/editar');
    expect(screen.getByRole('button', { name: /Estudiar este mazo/ })).toBeDisabled();
  });

  it('un mazo sin flashcards no se puede estudiar', async () => {
    await openDetail('d3');
    expect(screen.getByText(/no tiene flashcards/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Estudiar este mazo/ })).toBeDisabled();
  });

  it('un mazo inexistente muestra un aviso', async () => {
    renderApp('/mazos/nope', signedInService(), seeded());
    expect(await screen.findByText('No se encontró el mazo')).toBeInTheDocument();
  });
});

describe('M04 · Elegir modo de recorrida', () => {
  async function openPicker() {
    const view = await openDetail();
    await userEvent.click(screen.getByRole('button', { name: /Estudiar este mazo/ }));
    const dialog = within(screen.getByRole('dialog', { name: 'Saludos básicos · ¿Cómo recorrerlo?' }));
    return { ...view, dialog };
  }

  it('M04-1 lista todos los modos configurados y permite elegir uno (el primero viene elegido)', async () => {
    const { dialog } = await openPicker();
    const radios = dialog.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios[0]).toBeChecked();
    expect(dialog.getByText('Frente: Palabra y pinyin · Reverso: Solo traducción')).toBeInTheDocument();
    expect(dialog.getByText(/Libre/)).toBeInTheDocument();
    await userEvent.click(radios[1]);
    expect(radios[1]).toBeChecked();
  });

  it('M04-2 Comenzar abre el recorrido con el modo elegido', async () => {
    const { dialog, router } = await openPicker();
    await userEvent.click(dialog.getByRole('radio', { name: /Significado → Palabra/ }));
    await userEvent.click(dialog.getByRole('button', { name: /Comenzar/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/mazos/d1/estudiar'));
    expect(router.state.location.search).toBe('?modo=mB');
  });

  it('M04-3 Cancelar o Esc cierran el diálogo sin iniciar nada', async () => {
    const { dialog, router } = await openPicker();
    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /Estudiar este mazo/ }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(router.state.location.pathname).toBe('/mazos/d1'));
  });

  it('M04-4 es navegable con teclado: las flechas cambian de opción y Enter confirma', async () => {
    const { router } = await openPicker();
    expect(screen.getByRole('radio', { name: /Palabra → Significado/ })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: /Significado → Palabra/ })).toBeChecked();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(router.state.location.search).toBe('?modo=mB'));
  });

  it('recuerda el último modo usado y lo preselecciona', async () => {
    const first = await openPicker();
    await userEvent.click(first.dialog.getByRole('radio', { name: /Significado → Palabra/ }));
    await userEvent.click(first.dialog.getByRole('button', { name: /Comenzar/ }));
    await first.router.navigate('/mazos/d1');
    await userEvent.click(await screen.findByRole('button', { name: /Estudiar este mazo/ }));
    expect(screen.getByRole('radio', { name: /Significado → Palabra/ })).toBeChecked();
  });
});
