import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { chinese, deck } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

function seeded() {
  const repos = new MemoryRepositories();
  repos.languagesData = [chinese()];
  repos.decksData = [deck('d1', 'zh'), deck('d2', 'zh', { name: 'Frases útiles' })];
  return repos;
}

async function openLayout(path: string, repos = seeded()) {
  const view = renderApp(path, signedInService(), repos);
  await screen.findByLabelText(/Nombre del layout/);
  return { ...view, repos };
}

const layoutsOf = (repos: MemoryRepositories) => repos.languagesData.find((l) => l.id === 'zh')!.layouts;
const cell = (name: RegExp | string) => screen.getByRole('button', { name: typeof name === 'string' ? new RegExp(`^${name},`) : name });

describe('I04 · Editor de layout', () => {
  it('I04-1 se eligen los campos del idioma que aparecen en el layout', async () => {
    const { repos, router } = await openLayout('/idiomas/zh/layouts/nuevo');
    await userEvent.type(screen.getByLabelText(/Nombre del layout/), 'Mi layout');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar campo al layout' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Palabra' }));
    await userEvent.click(screen.getByRole('button', { name: 'Agregar campo al layout' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Traducción' }));
    expect(cell('Palabra')).toHaveAttribute('aria-pressed', 'false');
    expect(cell('Traducción')).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar layout' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/idiomas/zh'));
    const saved = layoutsOf(repos).find((l) => l.name === 'Mi layout')!;
    expect(saved.items.map((i) => i.fieldId)).toEqual(['word', 'translation']);
    expect(layoutsOf(repos)).toHaveLength(3);
  });

  it('I04-1 un campo que ya está en el layout no se vuelve a ofrecer', async () => {
    await openLayout('/idiomas/zh/layouts/ly1');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar campo al layout' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: 'Palabra' })).toBeNull();
    expect(within(dialog).queryByRole('button', { name: 'Pinyin' })).toBeNull();
    expect(within(dialog).getByRole('button', { name: 'Traducción' })).toBeInTheDocument();
  });

  it('I04-2 cada campo tiene posición y tamaño editables', async () => {
    const { repos } = await openLayout('/idiomas/zh/layouts/ly1');
    await userEvent.click(cell('Pinyin'));
    await userEvent.selectOptions(screen.getByLabelText('Ancho'), '3');
    await userEvent.selectOptions(screen.getByLabelText('Columna'), '2');
    await userEvent.click(screen.getByRole('button', { name: 'XL' }));
    await userEvent.click(screen.getByRole('button', { name: 'Izq.' }));
    expect(cell(/^Pinyin, columnas 2 a 4, fila 5/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar layout' }));
    await waitFor(() => expect(layoutsOf(repos).find((l) => l.id === 'ly1')!.items[1]).toMatchObject({
      fieldId: 'pinyin', col: 2, row: 5, colSpan: 3, rowSpan: 1, textSize: 'XL', align: 'left',
    }));
  });

  it('I04-3 no permite solapar campos: informa el error y conserva el valor', async () => {
    await openLayout('/idiomas/zh/layouts/ly1');
    await userEvent.click(cell('Pinyin'));
    await userEvent.selectOptions(screen.getByLabelText('Fila'), '2');
    expect(await screen.findByRole('alert')).toHaveTextContent('Se superpone con «Palabra»');
    expect(screen.getByLabelText('Fila')).toHaveValue('5');
  });

  it('I04-3 no permite salirse de la grilla', async () => {
    await openLayout('/idiomas/zh/layouts/ly1');
    await userEvent.click(cell('Pinyin'));
    await userEvent.selectOptions(screen.getByLabelText('Columna'), '4');
    expect(await screen.findByRole('alert')).toHaveTextContent('No cabe en la grilla');
    expect(screen.getByLabelText('Columna')).toHaveValue('1');
  });

  it('un cambio válido limpia el error anterior', async () => {
    await openLayout('/idiomas/zh/layouts/ly1');
    await userEvent.click(cell('Pinyin'));
    await userEvent.selectOptions(screen.getByLabelText('Fila'), '2');
    await screen.findByRole('alert');
    await userEvent.selectOptions(screen.getByLabelText('Fila'), '6');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('I04-4 el nombre es obligatorio y único; el idioma admite varios layouts', async () => {
    const { repos } = await openLayout('/idiomas/zh/layouts/nuevo');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar layout' }));
    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Nombre del layout/), 'solo TRADUCCIÓN');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar layout' }));
    expect(await screen.findByText('Ya existe un layout con ese nombre.')).toBeInTheDocument();
    expect(layoutsOf(repos)).toHaveLength(2);
  });

  it('un layout sin campos no se puede guardar', async () => {
    await openLayout('/idiomas/zh/layouts/nuevo');
    await userEvent.type(screen.getByLabelText(/Nombre del layout/), 'Vacío');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar layout' }));
    expect(await screen.findByText('Agrega al menos un campo al layout.')).toBeInTheDocument();
  });

  it('avisa cuando un campo seleccionado tiene audio', async () => {
    await openLayout('/idiomas/zh/layouts/ly1');
    expect(screen.getByText(/tiene audio/)).toHaveTextContent('Palabra');
    await userEvent.click(cell('Pinyin'));
    expect(screen.queryByText(/tiene audio/)).toBeNull();
  });

  it('se puede quitar un campo del layout', async () => {
    const { repos } = await openLayout('/idiomas/zh/layouts/ly1');
    await userEvent.click(cell('Pinyin'));
    await userEvent.click(screen.getByRole('button', { name: 'Quitar del layout' }));
    expect(screen.queryByRole('button', { name: /^Pinyin,/ })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar layout' }));
    await waitFor(() => expect(layoutsOf(repos).find((l) => l.id === 'ly1')!.items).toHaveLength(1));
  });

  it('I04-5 eliminar un layout en uso advierte qué mazos se verán afectados', async () => {
    const { repos, router } = await openLayout('/idiomas/zh/layouts/ly1');
    await userEvent.click(screen.getByRole('button', { name: /Eliminar layout/ }));
    const dialog = await screen.findByRole('alertdialog', { name: '¿Eliminar el layout «Palabra y pinyin»?' });
    await waitFor(() => expect(dialog).toHaveTextContent('Lo usan 2 modos de recorrida en 2 mazos'));
    expect(dialog).toHaveTextContent('«Saludos básicos» y «Frases útiles»');
    expect(dialog).toHaveTextContent('dejarán de poder usarse');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/idiomas/zh'));
    expect(layoutsOf(repos).map((l) => l.id)).toEqual(['ly2']);
  });

  it('I04-7 al eliminar un layout en uso, los modos de los mazos conservan su referencia (el mazo queda no disponible)', async () => {
    const { repos } = await openLayout('/idiomas/zh/layouts/ly1');
    await userEvent.click(screen.getByRole('button', { name: /Eliminar layout/ }));
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(layoutsOf(repos)).toHaveLength(1));
    expect(repos.decksData[0].modes[0].frontLayoutId).toBe('ly1');
  });

  it('eliminar un layout que ningún mazo usa lo informa', async () => {
    const repos = seeded();
    repos.decksData = [];
    await openLayout('/idiomas/zh/layouts/ly2', repos);
    await userEvent.click(screen.getByRole('button', { name: /Eliminar layout/ }));
    expect(await screen.findByText('Ningún mazo usa este layout. Esta acción no se puede deshacer.')).toBeInTheDocument();
  });

  it('I04-6 todo se hace con selects y botones, sin arrastrar (operable con teclado)', async () => {
    await openLayout('/idiomas/zh/layouts/ly1');
    await userEvent.click(cell('Pinyin'));
    screen.getByLabelText('Ancho').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByLabelText('Ancho')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar del layout' })).toBeEnabled();
  });

  it('los cambios sin guardar piden confirmación al salir', async () => {
    await openLayout('/idiomas/zh/layouts/ly1');
    await userEvent.type(screen.getByLabelText(/Nombre del layout/), ' 2');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(await screen.findByRole('alertdialog', { name: '¿Salir sin guardar?' })).toBeInTheDocument();
  });
});
