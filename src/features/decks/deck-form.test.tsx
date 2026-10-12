import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { card, chinese, deck, MODE_A, MODE_B } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

function seeded() {
  const repos = new MemoryRepositories();
  repos.languagesData = [chinese({ tags: ['Saludos', 'Escuela'] })];
  repos.flashcardsData = [
    card('c1', 'zh', { values: { word: '你好', translation: 'hola', pinyin: 'nǐ hǎo' }, tags: ['Saludos'] }),
    card('c2', 'zh', { values: { word: '谢谢', translation: 'gracias', pinyin: 'xièxie' }, tags: ['Saludos'] }),
    card('c3', 'zh', { values: { word: '学生', translation: 'estudiante', pinyin: 'xuésheng' }, tags: ['Escuela'] }),
    card('c4', 'zh', { values: { word: '水', translation: 'agua', pinyin: 'shuǐ' }, tags: [] }),
  ];
  repos.decksData = [deck('d1', 'zh', { name: 'Saludos básicos', cardIds: ['c1', 'c2'], modes: [MODE_A, MODE_B] })];
  return repos;
}

async function openForm(path = '/mazos/nuevo', repos = seeded()) {
  const view = renderApp(path, signedInService(), repos);
  await screen.findByLabelText(/Nombre/);
  return { ...view, repos };
}

const save = () => screen.getByRole('button', { name: 'Guardar mazo' });
const cardsSection = () => within(screen.getByRole('region', { name: /Flashcards/ }));
const modesSection = () => within(screen.getByRole('region', { name: 'Modos de recorrida' }));

async function pick(words: string[]) {
  await userEvent.click(screen.getByRole('button', { name: /^Agregar$/ }));
  const dialog = within(await screen.findByRole('dialog', { name: 'Agregar flashcards' }));
  for (const w of words) await userEvent.click(dialog.getByRole('checkbox', { name: w }));
  await userEvent.click(dialog.getByRole('button', { name: /Listo/ }));
}

async function addMode(name: string, front: string, back: string) {
  await userEvent.click(modesSection().getByRole('button', { name: 'Agregar modo' }));
  const dialog = within(screen.getByRole('dialog', { name: 'Nuevo modo de recorrida' }));
  await userEvent.type(dialog.getByLabelText(/Nombre del modo/), name);
  await userEvent.selectOptions(dialog.getByLabelText(/Layout del frente/), front);
  await userEvent.selectOptions(dialog.getByLabelText(/Layout del reverso/), back);
  await userEvent.click(dialog.getByRole('button', { name: 'Agregar modo' }));
}

describe('M02 · Crear mazo', () => {
  it('M02-1 permite crear un mazo con nombre, flashcards del idioma y al menos un modo', async () => {
    const { repos, router } = await openForm();
    await userEvent.type(screen.getByLabelText(/Nombre/), '  Mi mazo ');
    await pick(['你好', '水']);
    await addMode('Palabra → Significado', 'Palabra y pinyin', 'Solo traducción');
    await userEvent.click(save());
    await waitFor(() => expect(repos.decksData).toHaveLength(2));
    const created = repos.decksData.find((d) => d.name === 'Mi mazo')!;
    expect(created).toMatchObject({ languageId: 'zh', cardIds: ['c1', 'c4'], learning: 'free' });
    expect(created.modes).toHaveLength(1);
    expect(created.modes[0]).toMatchObject({ name: 'Palabra → Significado', frontLayoutId: 'ly1', backLayoutId: 'ly2' });
    expect(router.state.location.pathname).toBe(`/mazos/${created.id}`);
    expect(await screen.findByText('Mazo guardado')).toBeInTheDocument();
  });

  it('M02-2 el selector permite buscar, filtrar por tags y elegir o quitar varias flashcards', async () => {
    await openForm();
    await userEvent.click(screen.getByRole('button', { name: /^Agregar$/ }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Agregar flashcards' }));
    expect(dialog.getAllByRole('checkbox')).toHaveLength(4);

    await userEvent.type(dialog.getByLabelText('Buscar flashcards'), 'gracias');
    expect(dialog.getAllByRole('checkbox')).toHaveLength(1);
    await userEvent.clear(dialog.getByLabelText('Buscar flashcards'));

    await userEvent.click(within(dialog.getByRole('group', { name: 'Filtrar por tag' })).getByRole('button', { name: 'Saludos' }));
    expect(dialog.getAllByRole('checkbox')).toHaveLength(2);
    await userEvent.click(dialog.getByRole('button', { name: 'Seleccionar todas las visibles' }));
    expect(dialog.getByRole('button', { name: /Listo · 2 seleccionadas/ })).toBeInTheDocument();
    await userEvent.click(dialog.getByRole('button', { name: 'Quitar todas las visibles' }));
    expect(dialog.getByRole('button', { name: /Listo · 0 seleccionadas/ })).toBeInTheDocument();
    await userEvent.click(within(dialog.getByRole('group', { name: 'Filtrar por tag' })).getByRole('button', { name: 'Todas' }));
    await userEvent.click(dialog.getByRole('checkbox', { name: '学生' }));
    expect(dialog.getByRole('button', { name: /Listo · 1 seleccionada$/ })).toBeInTheDocument();
  });

  it('M02-2 se pueden quitar flashcards ya incluidas y las incluidas llegan marcadas', async () => {
    await openForm('/mazos/d1/editar');
    expect(cardsSection().getAllByRole('listitem')).toHaveLength(2);
    await userEvent.click(cardsSection().getByRole('button', { name: 'Quitar 你好 del mazo' }));
    expect(cardsSection().getAllByRole('listitem')).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /^Agregar$/ }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.getByRole('checkbox', { name: '谢谢' })).toBeChecked();
    expect(dialog.getByRole('checkbox', { name: '你好' })).not.toBeChecked();
  });

  it('M02-3 al llegar desde F02 las flashcards seleccionadas ya están en el mazo', async () => {
    await openForm('/mazos/nuevo?cartas=c2,c3,nope');
    expect(cardsSection().getAllByRole('listitem')).toHaveLength(2);
    expect(cardsSection().getByText('谢谢')).toBeInTheDocument();
    expect(cardsSection().getByText('学生')).toBeInTheDocument();
  });

  it('M02-4 se pueden agregar varios modos que combinan un layout de frente y uno de reverso', async () => {
    const { repos } = await openForm();
    await userEvent.type(screen.getByLabelText(/Nombre/), 'Dos modos');
    await pick(['你好']);
    await addMode('Uno', 'Palabra y pinyin', 'Solo traducción');
    await addMode('Dos', 'Solo traducción', 'Palabra y pinyin');
    expect(modesSection().getAllByRole('listitem')).toHaveLength(2);
    expect(modesSection().getByText('Frente: Solo traducción · Reverso: Palabra y pinyin')).toBeInTheDocument();
    await userEvent.click(save());
    await waitFor(() => expect(repos.decksData).toHaveLength(2));
    expect(repos.decksData.find((d) => d.name === 'Dos modos')!.modes.map((m) => m.name)).toEqual(['Uno', 'Dos']);
  });

  it('un modo se puede editar y quitar', async () => {
    const { repos } = await openForm('/mazos/d1/editar');
    await userEvent.click(modesSection().getByRole('button', { name: 'Editar modo Palabra → Significado' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Editar modo de recorrida' }));
    const name = dialog.getByLabelText(/Nombre del modo/);
    await userEvent.clear(name);
    await userEvent.type(name, 'Renombrado');
    await userEvent.click(dialog.getByRole('button', { name: 'Guardar modo' }));
    await userEvent.click(modesSection().getByRole('button', { name: 'Quitar modo Significado → Palabra' }));
    await userEvent.click(save());
    await waitFor(() => expect(repos.decksData[0].modes.map((m) => m.name)).toEqual(['Renombrado']));
  });

  it('M02-5 "Libre" es la única forma de aprendizaje y está preseleccionada', async () => {
    await openForm();
    expect(screen.getByRole('radio', { name: /Libre/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Repaso espaciado/ })).toBeDisabled();
  });

  it('M02-6 no se guarda sin nombre, sin flashcards o sin modos: los errores aparecen junto a su sección', async () => {
    const { repos } = await openForm();
    await userEvent.click(save());
    expect(screen.getByLabelText(/Nombre/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Nombre/)).toHaveFocus();
    expect(screen.getByText('El nombre es obligatorio.')).toBeInTheDocument();
    expect(cardsSection().getByText('El mazo necesita al menos una flashcard.')).toBeInTheDocument();
    expect(modesSection().getByText('El mazo necesita al menos un modo de recorrida.')).toBeInTheDocument();
    expect(repos.decksData).toHaveLength(1);
  });

  it('el error de una sección desaparece al corregirla', async () => {
    await openForm();
    await userEvent.click(save());
    await pick(['你好']);
    expect(cardsSection().queryByText('El mazo necesita al menos una flashcard.')).toBeNull();
    await addMode('Modo', 'Palabra y pinyin', 'Solo traducción');
    expect(modesSection().queryByText('El mazo necesita al menos un modo de recorrida.')).toBeNull();
  });

  it('un idioma sin layouts no permite armar modos y enlaza a Idiomas', async () => {
    const repos = seeded();
    repos.languagesData = [chinese({ layouts: [] })];
    await openForm('/mazos/nuevo', repos);
    expect(modesSection().getByRole('button', { name: 'Agregar modo' })).toBeDisabled();
    expect(modesSection().getByRole('link', { name: 'Crea uno en Idiomas' })).toHaveAttribute('href', '/idiomas/zh?tab=layouts');
  });

  it('el modo exige nombre y ambos layouts', async () => {
    await openForm();
    await userEvent.click(modesSection().getByRole('button', { name: 'Agregar modo' }));
    const dialog = within(screen.getByRole('dialog'));
    await userEvent.click(dialog.getByRole('button', { name: 'Agregar modo' }));
    expect(dialog.getByText('El nombre es obligatorio.')).toBeInTheDocument();
  });

  it('los cambios sin guardar piden confirmación al salir', async () => {
    const { router } = await openForm();
    await userEvent.type(screen.getByLabelText(/Nombre/), 'X');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(await screen.findByRole('alertdialog', { name: '¿Salir sin guardar?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Salir sin guardar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/mazos'));
  });
});

describe('M02 · Editar mazo', () => {
  it('M02-7 en edición se precargan los datos', async () => {
    await openForm('/mazos/d1/editar');
    expect(screen.getByRole('heading', { name: 'Editar mazo' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/)).toHaveValue('Saludos básicos');
    expect(cardsSection().getAllByRole('listitem')).toHaveLength(2);
    expect(modesSection().getAllByRole('listitem')).toHaveLength(2);
  });

  it('M02-7 Eliminar mazo pide confirmación y no elimina las flashcards', async () => {
    const { repos, router } = await openForm('/mazos/d1/editar');
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar mazo' }));
    const dialog = within(await screen.findByRole('alertdialog', { name: '¿Eliminar el mazo «Saludos básicos»?' }));
    expect(dialog.getByText(/Las flashcards no se eliminan/)).toBeInTheDocument();
    await userEvent.click(dialog.getByRole('button', { name: 'Cancelar' }));
    expect(repos.decksData).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar mazo' }));
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Eliminar mazo' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/mazos'));
    expect(repos.decksData).toHaveLength(0);
    expect(repos.flashcardsData).toHaveLength(4);
  });

  it('un mazo nuevo no ofrece Eliminar mazo', async () => {
    await openForm();
    expect(screen.queryByRole('button', { name: 'Eliminar mazo' })).toBeNull();
  });

  it('M02-8 se repara un mazo no disponible eligiendo otro layout en el modo afectado', async () => {
    const repos = seeded();
    repos.decksData = [deck('d1', 'zh', { name: 'Roto', cardIds: ['c1'], modes: [{ ...MODE_A, frontLayoutId: 'borrado' }] })];
    await openForm('/mazos/d1/editar', repos);
    expect(modesSection().getByText('Layout eliminado')).toBeInTheDocument();

    await userEvent.click(save());
    expect(await modesSection().findByText(/usa un layout que fue eliminado/)).toBeInTheDocument();
    expect(repos.decksData[0].modes[0].frontLayoutId).toBe('borrado');

    await userEvent.click(modesSection().getByRole('button', { name: 'Editar modo Palabra → Significado' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Editar modo de recorrida' }));
    expect(dialog.getByLabelText(/Layout del frente/)).toHaveValue('');
    await userEvent.click(dialog.getByRole('button', { name: 'Guardar modo' }));
    expect(dialog.getByText('Elige un layout.')).toBeInTheDocument();
    await userEvent.selectOptions(dialog.getByLabelText(/Layout del frente/), 'Palabra y pinyin');
    await userEvent.click(dialog.getByRole('button', { name: 'Guardar modo' }));
    expect(modesSection().queryByText('Layout eliminado')).toBeNull();

    await userEvent.click(save());
    await waitFor(() => expect(repos.decksData[0].modes[0].frontLayoutId).toBe('ly1'));
  });

  it('un mazo inexistente muestra un aviso', async () => {
    renderApp('/mazos/nope/editar', signedInService(), seeded());
    expect(await screen.findByText('No se encontró el mazo')).toBeInTheDocument();
  });
});
