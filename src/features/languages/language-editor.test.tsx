import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { card, chinese, deck } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

function seeded() {
  const repos = new MemoryRepositories();
  repos.languagesData = [chinese(), chinese({ id: 'ja', name: 'Japonés', code: 'ja-JP', tags: [], layouts: [] })];
  repos.flashcardsData = [card('c1', 'zh', { tags: ['Saludos', 'Escuela'] }), card('c2', 'zh')];
  repos.decksData = [deck('d1', 'zh')];
  return repos;
}

const saveButton = () => screen.getByRole('button', { name: 'Guardar idioma' });

async function openEditor(path = '/idiomas/zh', repos = seeded()) {
  const view = renderApp(path, signedInService(), repos);
  await screen.findByLabelText(/Nombre del idioma/);
  return { ...view, repos };
}

describe('I02 · Crear y guardar idiomas', () => {
  it('I02-1 se crea un idioma con nombre y nace con los tres campos de sistema', async () => {
    const { repos, router } = await openEditor('/idiomas/nuevo', new MemoryRepositories());
    const rows = within(screen.getByRole('tabpanel')).getAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining('Palabra'), expect.stringContaining('Traducción'), expect.stringContaining('Tags'),
    ]);
    await userEvent.type(screen.getByLabelText(/Nombre del idioma/), 'Coreano');
    await userEvent.selectOptions(screen.getByLabelText(/Código de idioma/), 'ko-KR');
    await userEvent.click(saveButton());
    await waitFor(() => expect(router.state.location.pathname).toBe('/idiomas'));
    expect(repos.languagesData).toHaveLength(1);
    expect(repos.languagesData[0]).toMatchObject({ name: 'Coreano', code: 'ko-KR', tags: [], layouts: [] });
    expect(repos.languagesData[0].fields.map((f) => f.system)).toEqual(['word', 'translation', 'tags']);
    expect(await screen.findByText('Idioma guardado')).toBeInTheDocument();
  });

  it('I02-7 el nombre es obligatorio y único', async () => {
    const { repos } = await openEditor('/idiomas/nuevo', seeded());
    await userEvent.click(saveButton());
    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Nombre del idioma/), 'chino MANDARÍN');
    await userEvent.click(saveButton());
    expect(await screen.findByText('Ya existe un idioma con ese nombre.')).toBeInTheDocument();
    expect(repos.languagesData).toHaveLength(2);
  });

  it('I02-7 los cambios sin guardar piden confirmación al salir', async () => {
    const { router } = await openEditor();
    await userEvent.type(screen.getByLabelText(/Nombre del idioma/), ' X');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    const dialog = await screen.findByRole('alertdialog', { name: '¿Salir sin guardar?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Seguir editando' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/idiomas/zh'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Salir sin guardar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/idiomas'));
  });

  it('sin cambios, Cancelar sale directamente', async () => {
    const { router } = await openEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/idiomas'));
  });
});

describe('I02/I03 · Campos', () => {
  it('I02-2 / I03-2 los campos de sistema no se pueden eliminar ni cambiar de tipo; Palabra es obligatoria', async () => {
    await openEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Editar campo Palabra' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar campo' });
    expect(within(dialog).queryByRole('button', { name: /Eliminar/ })).toBeNull();
    expect(within(dialog).getByRole('button', { name: 'Número' })).toBeDisabled();
    expect(within(dialog).getByRole('switch', { name: 'Obligatorio' })).toBeDisabled();
    expect(within(dialog).getByRole('switch', { name: 'Obligatorio' })).toBeChecked();
  });

  it('I03-1 permite definir nombre, descripción, tipo, valor por defecto, TTS y obligatorio', async () => {
    const { repos } = await openEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Agregar campo' }));
    const dialog = screen.getByRole('dialog', { name: 'Nuevo campo' });
    await userEvent.type(within(dialog).getByLabelText(/Nombre/), 'Ejemplo');
    await userEvent.type(within(dialog).getByLabelText(/Descripción/), 'Oración de ejemplo');
    await userEvent.type(within(dialog).getByLabelText(/Valor por defecto/), 'ninguno');
    await userEvent.click(within(dialog).getByRole('switch', { name: 'Text-to-speech' }));
    await userEvent.click(within(dialog).getByRole('switch', { name: 'Obligatorio' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(saveButton());
    await waitFor(() => expect(repos.languagesData.find((l) => l.id === 'zh')!.fields).toHaveLength(5));
    const added = repos.languagesData.find((l) => l.id === 'zh')!.fields.at(-1)!;
    expect(added).toMatchObject({ name: 'Ejemplo', description: 'Oración de ejemplo', type: 'text', defaultValue: 'ninguno', tts: true, required: true });
  });

  it('I03-1 un campo numérico guarda su valor por defecto como número y no admite TTS', async () => {
    const { repos } = await openEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Agregar campo' }));
    const dialog = screen.getByRole('dialog', { name: 'Nuevo campo' });
    await userEvent.type(within(dialog).getByLabelText(/Nombre/), 'Nivel');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Número' }));
    expect(within(dialog).getByRole('switch', { name: 'Text-to-speech' })).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText(/Valor por defecto/), '1');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    await userEvent.click(saveButton());
    await waitFor(() => expect(repos.languagesData.find((l) => l.id === 'zh')!.fields).toHaveLength(5));
    expect(repos.languagesData.find((l) => l.id === 'zh')!.fields.at(-1)).toMatchObject({ type: 'number', defaultValue: 1, tts: false });
  });

  it('I03-3 un nombre vacío o repetido muestra un error junto al campo', async () => {
    await openEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Agregar campo' }));
    const dialog = screen.getByRole('dialog', { name: 'Nuevo campo' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    expect(within(dialog).getByText('El nombre es obligatorio.')).toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText(/Nombre/), 'pinyin');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    expect(within(dialog).getByText('Ya existe un campo con ese nombre.')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Nombre/)).toHaveAttribute('aria-invalid', 'true');
  });

  it('I02-3 se puede editar y reordenar un campo', async () => {
    const { repos } = await openEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Editar campo Pinyin' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar campo' });
    const name = within(dialog).getByLabelText(/Nombre/);
    await userEvent.clear(name);
    await userEvent.type(name, 'Romanización');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Mover abajo' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    await userEvent.click(saveButton());
    await waitFor(() => expect(repos.languagesData.find((l) => l.id === 'zh')!.fields.map((f) => f.id)).toEqual(['word', 'translation', 'pinyin', 'tags']));
    expect(repos.languagesData.find((l) => l.id === 'zh')!.fields[2].name).toBe('Romanización');
  });

  it('I03-4 / I02-3 eliminar un campo propio pide confirmación, informa el impacto y se propaga al guardar', async () => {
    const { repos } = await openEditor();
    await userEvent.click(screen.getByRole('button', { name: 'Editar campo Pinyin' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Eliminar/ }));
    const confirm = screen.getByRole('alertdialog', { name: '¿Eliminar el campo «Pinyin»?' });
    expect(confirm).toHaveTextContent('Se borrará el dato de este campo en todas las flashcards');
    expect(confirm).toHaveTextContent('1 layout');
    await userEvent.click(within(confirm).getByRole('button', { name: 'Eliminar campo' }));
    await userEvent.click(saveButton());
    await waitFor(() => expect(repos.languagesData.find((l) => l.id === 'zh')!.fields).toHaveLength(3));
    const zh = repos.languagesData.find((l) => l.id === 'zh')!;
    expect(zh.layouts[0].items.map((i) => i.fieldId)).toEqual(['word']);
    expect(repos.flashcardsData.every((c) => !('pinyin' in c.values))).toBe(true);
  });
});

describe('I02 · Tags', () => {
  async function openTags() {
    const view = await openEditor();
    await userEvent.click(screen.getByRole('tab', { name: 'Tags' }));
    return view;
  }

  it('I02-4 agrega tags sin duplicados (sin distinguir mayúsculas) y los quita', async () => {
    const { repos } = await openTags();
    const input = screen.getByLabelText('Nuevo tag');
    await userEvent.type(input, 'Comida');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(screen.getByText('Comida')).toBeInTheDocument();
    await userEvent.type(input, 'saludos');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(await screen.findByText('El tag «saludos» ya existe.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Quitar tag Escuela' }));
    await userEvent.click(saveButton());
    await waitFor(() => expect(repos.languagesData.find((l) => l.id === 'zh')!.tags).toEqual(['Saludos', 'Comida']));
  });

  it('quitar un tag lo quita de las flashcards que lo usan', async () => {
    const { repos } = await openTags();
    await userEvent.click(screen.getByRole('button', { name: 'Quitar tag Saludos' }));
    await userEvent.click(saveButton());
    await waitFor(() => expect(repos.languagesData.find((l) => l.id === 'zh')!.tags).toEqual(['Escuela']));
    expect(repos.flashcardsData.find((c) => c.id === 'c1')!.tags).toEqual(['Escuela']);
    expect(repos.flashcardsData.find((c) => c.id === 'c2')!.tags).toEqual([]);
  });

  it('MJ7-6 editar un tag lo renombra en el idioma y en las flashcards que lo usan', async () => {
    const { repos } = await openTags();
    await userEvent.click(screen.getByRole('button', { name: 'Editar tag Saludos' }));
    const input = screen.getByLabelText('Nuevo nombre del tag Saludos');
    expect(input).toHaveFocus();
    await userEvent.clear(input);
    await userEvent.type(input, 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByText('Hola')).toBeInTheDocument();
    await userEvent.click(saveButton());
    await waitFor(() => expect(repos.languagesData.find((l) => l.id === 'zh')!.tags).toEqual(['Hola', 'Escuela']));
    expect(repos.flashcardsData.find((c) => c.id === 'c1')!.tags).toEqual(['Hola', 'Escuela']);
    expect(repos.flashcardsData.find((c) => c.id === 'c2')!.tags).toEqual(['Hola']);
  });

  it('MJ7-7 no permite un nombre vacío ni el de otro tag; Cancelar descarta la edición', async () => {
    const { repos } = await openTags();
    await userEvent.click(screen.getByRole('button', { name: 'Editar tag Saludos' }));
    const input = screen.getByLabelText('Nuevo nombre del tag Saludos');
    await userEvent.clear(input);
    await userEvent.type(input, 'escuela');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('El tag «escuela» ya existe.')).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('El nombre del tag no puede estar vacío.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar edición del tag Saludos' }));
    expect(screen.queryByLabelText('Nuevo nombre del tag Saludos')).toBeNull();
    expect(repos.languagesData.find((l) => l.id === 'zh')!.tags).toEqual(['Saludos', 'Escuela']);
  });

  it('MJ7-8 renombrar y luego quitar un tag lo quita de las flashcards con su nombre original', async () => {
    const { repos } = await openTags();
    await userEvent.click(screen.getByRole('button', { name: 'Editar tag Saludos' }));
    const input = screen.getByLabelText('Nuevo nombre del tag Saludos');
    await userEvent.clear(input);
    await userEvent.type(input, 'Hola');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Quitar tag Hola' }));
    await userEvent.click(saveButton());
    await waitFor(() => expect(repos.languagesData.find((l) => l.id === 'zh')!.tags).toEqual(['Escuela']));
    expect(repos.flashcardsData.find((c) => c.id === 'c1')!.tags).toEqual(['Escuela']);
    expect(repos.flashcardsData.find((c) => c.id === 'c2')!.tags).toEqual([]);
  });

  it('la pestaña activa vive en la URL (?tab=)', async () => {
    const { router } = await openEditor('/idiomas/zh?tab=tags');
    expect(screen.getByRole('tab', { name: 'Tags' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('tab', { name: 'Layouts' }));
    expect(router.state.location.search).toBe('?tab=layouts');
  });
});

describe('I02 · Layouts (listado)', () => {
  it('I02-5 la pestaña lista los layouts con miniatura y lleva a crearlos y editarlos', async () => {
    const { router } = await openEditor('/idiomas/zh?tab=layouts');
    expect(screen.getByRole('link', { name: 'Editar layout Palabra y pinyin' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Editar layout Solo traducción' })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('link', { name: /Nuevo layout|Layout/ })[0]);
    await waitFor(() => expect(router.state.location.pathname).toBe('/idiomas/zh/layouts/nuevo'));
  });

  it('un idioma sin guardar pide guardarlo antes de crear layouts', async () => {
    await openEditor('/idiomas/nuevo?tab=layouts', new MemoryRepositories());
    expect(screen.getByText('Guarda el idioma para poder crear layouts.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Nuevo layout/ })).toBeNull();
  });
});

describe('I02 · Eliminar idioma', () => {
  it('I02-6 exige escribir el nombre y avisa de lo que se borrará', async () => {
    const { repos, router } = await openEditor();
    await userEvent.click(screen.getAllByRole('button', { name: /Eliminar idioma/ })[0]);
    const dialog = await screen.findByRole('alertdialog', { name: '¿Eliminar «Chino mandarín»?' });
    await waitFor(() => expect(dialog).toHaveTextContent('Se eliminarán también sus 2 flashcards y 1 mazo.'));
    const confirm = within(dialog).getByRole('button', { name: 'Eliminar idioma' });
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText(/Escribe el nombre/), 'Chino');
    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText(/Escribe el nombre/), ' mandarín');
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    await waitFor(() => expect(router.state.location.pathname).toBe('/idiomas'));
    expect(repos.languagesData.map((l) => l.id)).toEqual(['ja']);
    expect(repos.flashcardsData).toHaveLength(0);
    expect(repos.decksData).toHaveLength(0);
  });

  it('no se ofrece eliminar un idioma que todavía no existe', async () => {
    await openEditor('/idiomas/nuevo', new MemoryRepositories());
    expect(screen.queryByRole('button', { name: /Eliminar idioma/ })).toBeNull();
  });
});

describe('I02 · Idioma inexistente', () => {
  it('muestra un aviso con enlace al listado', async () => {
    renderApp('/idiomas/nope', signedInService(), seeded());
    expect(await screen.findByText('No se encontró el idioma')).toBeInTheDocument();
  });
});
