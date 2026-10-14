import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { card, chinese, deck, MODE_A, MODE_B } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

function seeded(defaultModes = [MODE_A, MODE_B]) {
  const repos = new MemoryRepositories();
  repos.languagesData = [chinese({ defaultModes })];
  repos.flashcardsData = [card('c1', 'zh', { values: { word: '你好', translation: 'hola' } })];
  repos.decksData = [deck('d1', 'zh', { name: 'Existente', cardIds: ['c1'], modes: [] })];
  return repos;
}

const modesSection = () => within(screen.getByRole('region', { name: 'Modos de recorrida' }));
const panel = () => within(screen.getByRole('region', { name: 'Modos de recorrida por defecto' }));

describe('MJ4 · Modos de recorrida por defecto del idioma', () => {
  it('MJ4-2 el editor de idioma agrega, edita y quita modos por defecto y los guarda en el idioma', async () => {
    const repos = seeded([]);
    renderApp('/idiomas/zh?tab=recorridas', signedInService(), repos);
    await screen.findByRole('region', { name: 'Modos de recorrida por defecto' });
    expect(panel().getByText(/no hay modos por defecto/)).toBeInTheDocument();

    await userEvent.click(panel().getByRole('button', { name: 'Agregar modo' }));
    let dialog = within(screen.getByRole('dialog', { name: 'Nuevo modo de recorrida' }));
    await userEvent.type(dialog.getByLabelText(/Nombre del modo/), 'Palabra → Significado');
    await userEvent.selectOptions(dialog.getByLabelText(/Layout del frente/), 'Palabra y pinyin');
    await userEvent.selectOptions(dialog.getByLabelText(/Layout del reverso/), 'Solo traducción');
    await userEvent.click(dialog.getByRole('button', { name: 'Agregar modo' }));
    expect(panel().getByText('Frente: Palabra y pinyin · Reverso: Solo traducción')).toBeInTheDocument();

    await userEvent.click(panel().getByRole('button', { name: 'Editar modo por defecto Palabra → Significado' }));
    dialog = within(screen.getByRole('dialog', { name: 'Editar modo de recorrida' }));
    await userEvent.clear(dialog.getByLabelText(/Nombre del modo/));
    await userEvent.type(dialog.getByLabelText(/Nombre del modo/), 'Directo');
    await userEvent.click(dialog.getByRole('button', { name: 'Guardar modo' }));

    await userEvent.click(screen.getByRole('button', { name: 'Guardar idioma' }));
    await waitFor(() => expect(repos.languagesData[0].defaultModes).toHaveLength(1));
    expect(repos.languagesData[0].defaultModes![0]).toMatchObject({ name: 'Directo', frontLayoutId: 'ly1', backLayoutId: 'ly2' });
  });

  it('MJ4-3 quitar un modo por defecto lo borra del idioma', async () => {
    const repos = seeded();
    renderApp('/idiomas/zh?tab=recorridas', signedInService(), repos);
    await userEvent.click(await screen.findByRole('button', { name: 'Quitar modo por defecto Palabra → Significado' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar idioma' }));
    await waitFor(() => expect(repos.languagesData[0].defaultModes!.map((m) => m.id)).toEqual(['mB']));
  });

  it('MJ4-4 un mazo nuevo trae copias de los modos por defecto, que se pueden editar y quitar sin tocar el idioma', async () => {
    const repos = seeded();
    const { router } = renderApp('/mazos/nuevo', signedInService(), repos);
    await screen.findByLabelText(/Nombre/);
    expect(modesSection().getByText('Palabra → Significado')).toBeInTheDocument();
    expect(modesSection().getByText('Significado → Palabra')).toBeInTheDocument();

    await userEvent.click(modesSection().getByRole('button', { name: 'Quitar modo Significado → Palabra' }));
    await userEvent.click(modesSection().getByRole('button', { name: 'Editar modo Palabra → Significado' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Editar modo de recorrida' }));
    await userEvent.clear(dialog.getByLabelText(/Nombre del modo/));
    await userEvent.type(dialog.getByLabelText(/Nombre del modo/), 'Solo en este mazo');
    await userEvent.click(dialog.getByRole('button', { name: 'Guardar modo' }));

    await userEvent.type(screen.getByLabelText(/Nombre/), 'Nuevo');
    await userEvent.click(screen.getByRole('button', { name: /^Agregar$/ }));
    const picker = within(await screen.findByRole('dialog', { name: 'Agregar flashcards' }));
    await userEvent.click(picker.getByRole('checkbox', { name: '你好' }));
    await userEvent.click(picker.getByRole('button', { name: /Listo/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar mazo' }));

    await waitFor(() => expect(repos.decksData).toHaveLength(2));
    const created = repos.decksData.find((d) => d.name === 'Nuevo')!;
    expect(created.modes).toHaveLength(1);
    expect(created.modes[0]).toMatchObject({ name: 'Solo en este mazo', frontLayoutId: 'ly1', backLayoutId: 'ly2' });
    expect(created.modes[0].id).not.toBe('mA');
    expect(repos.languagesData[0].defaultModes).toEqual([MODE_A, MODE_B]);
    await waitFor(() => expect(router.state.location.pathname).toBe(`/mazos/${created.id}`));
  });

  it('MJ4-5 los mazos existentes no cambian y editar uno no le agrega los modos por defecto', async () => {
    const repos = seeded();
    renderApp('/mazos/d1/editar', signedInService(), repos);
    await screen.findByLabelText(/Nombre/);
    expect(modesSection().queryByText('Palabra → Significado')).toBeNull();
    expect(repos.decksData[0].modes).toEqual([]);
  });

  it('MJ4-6 un modo por defecto cuyo layout fue eliminado se marca en el idioma y no se aplica a los mazos nuevos', async () => {
    const roto = { ...MODE_B, id: 'roto', name: 'Roto', frontLayoutId: 'borrado' };
    const repos = seeded([MODE_A, roto]);
    renderApp('/idiomas/zh?tab=recorridas', signedInService(), repos);
    expect(await screen.findByText(/Layout eliminado · no se aplicará/)).toBeInTheDocument();
  });

  it('MJ4-7 un mazo nuevo omite los modos por defecto rotos', async () => {
    const roto = { ...MODE_B, id: 'roto', name: 'Roto', frontLayoutId: 'borrado' };
    renderApp('/mazos/nuevo', signedInService(), seeded([MODE_A, roto]));
    await screen.findByLabelText(/Nombre/);
    expect(modesSection().getByText('Palabra → Significado')).toBeInTheDocument();
    expect(modesSection().queryByText('Roto')).toBeNull();
  });
});
