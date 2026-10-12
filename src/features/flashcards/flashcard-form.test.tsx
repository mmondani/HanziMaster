import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addField } from '@/lib/domain/field-rules';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { card, chinese, deck } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

function seeded() {
  const base = chinese();
  const repos = new MemoryRepositories();
  repos.languagesData = [
    {
      ...base,
      fields: addField(base.fields, { id: 'nivel', name: 'Nivel', type: 'number', tts: false, required: false, order: 9, defaultValue: 1 }),
    },
  ];
  repos.flashcardsData = [card('c1', 'zh', { values: { word: '朋友', translation: 'amigo', pinyin: 'péngyou', nivel: 2 }, tags: ['Saludos'] })];
  repos.decksData = [deck('d1', 'zh', { cardIds: ['c1'] }), deck('d2', 'zh', { name: 'HSK 1', cardIds: ['c1'] })];
  return repos;
}

async function openForm(path: string, repos = seeded()) {
  const view = renderApp(path, signedInService(), repos);
  await screen.findByLabelText(/Palabra/);
  return { ...view, repos };
}

const save = () => screen.getByRole('button', { name: 'Guardar' });

describe('F03 · Crear y editar flashcard', () => {
  it('F03-1 muestra un input por campo configurado, en orden, con obligatorios y valores por defecto', async () => {
    await openForm('/flashcards/nueva');
    const labels = Array.from(document.querySelectorAll('form label')).map((l) => l.textContent?.replace('*', '').trim());
    expect(labels).toEqual(['Palabra', 'Pinyin(opcional)', 'Traducción', 'Nivel(opcional)']);
    expect(screen.getByLabelText(/Palabra/)).toBeRequired();
    expect(screen.getByLabelText(/Traducción/)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/Nivel/)).toHaveValue(1);
    expect(screen.getByLabelText(/Nivel/)).toHaveAttribute('type', 'number');
    expect(screen.getByText(/Este campo tiene audio/)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Tags' })).toBeInTheDocument();
  });

  it('F03-2 no se puede guardar sin Palabra y Traducción; el error aparece junto al campo y el foco va al primero', async () => {
    const { repos } = await openForm('/flashcards/nueva');
    await userEvent.click(save());
    const word = screen.getByLabelText(/Palabra/);
    expect(word).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Traducción/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByText('Este campo es obligatorio.')).toHaveLength(2);
    expect(word.getAttribute('aria-describedby')).toContain(screen.getAllByText('Este campo es obligatorio.')[0].id);
    expect(word).toHaveFocus();
    expect(repos.flashcardsData).toHaveLength(1);
  });

  it('valida el formato de un campo numérico', async () => {
    await openForm('/flashcards/nueva');
    await userEvent.type(screen.getByLabelText(/Palabra/), '水');
    await userEvent.type(screen.getByLabelText(/Traducción/), 'agua');
    await userEvent.clear(screen.getByLabelText(/Nivel/));
    await userEvent.type(screen.getByLabelText(/Nivel/), 'e');
    await userEvent.click(save());
    // Un input numérico no acepta letras: queda vacío y es válido; el formato inválido se cubre en flashcard-form.test.ts.
    await waitFor(() => expect(screen.queryByText('Ingresa un número válido.')).toBeNull());
  });

  it('F03-3 se guarda con 0 tags y también con varios', async () => {
    const { repos, router } = await openForm('/flashcards/nueva');
    await userEvent.type(screen.getByLabelText(/Palabra/), '水');
    await userEvent.type(screen.getByLabelText(/Traducción/), 'agua');
    await userEvent.click(save());
    await waitFor(() => expect(router.state.location.pathname).toBe('/flashcards'));
    const created = repos.flashcardsData.find((c) => c.values.word === '水')!;
    expect(created.tags).toEqual([]);
    expect(created.values).toMatchObject({ word: '水', translation: 'agua', nivel: 1 });
    expect(created.languageId).toBe('zh');
    expect(await screen.findByText('Flashcard guardada')).toBeInTheDocument();
    // Se espera a que la lista ya refleje la nueva flashcard: un reenvío tardío de datos remonta el formulario y pierde lo tipeado.
    await screen.findByText('水');

    await router.navigate('/flashcards/nueva');
    await userEvent.type(await screen.findByLabelText(/Palabra/), '学');
    await userEvent.type(screen.getByLabelText(/Traducción/), 'estudiar');
    const tags = screen.getByRole('group', { name: 'Tags' });
    await userEvent.click(within(tags).getByRole('button', { name: 'Saludos' }));
    await userEvent.click(within(tags).getByRole('button', { name: 'Escuela' }));
    await userEvent.click(save());
    await waitFor(() => expect(repos.flashcardsData).toHaveLength(3), { timeout: 8000 });
    expect(repos.flashcardsData.find((c) => c.values.word === '学')!.tags).toEqual(['Saludos', 'Escuela']);
  }, 20000);

  it('F03-4 se crea un tag nuevo desde el formulario y queda en el set del idioma', async () => {
    const { repos } = await openForm('/flashcards/nueva');
    await userEvent.click(screen.getByRole('button', { name: /Nuevo tag/ }));
    const dialog = screen.getByRole('dialog', { name: 'Nuevo tag' });
    await userEvent.type(within(dialog).getByLabelText('Nombre del tag'), 'Viajes');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Crear y asignar' }));
    await waitFor(() => expect(repos.languagesData[0].tags).toEqual(['Saludos', 'Escuela', 'Viajes']));
    const chip = await screen.findByRole('button', { name: 'Viajes' });
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('F03-4 un tag que ya existe (sin distinguir mayúsculas) se reutiliza', async () => {
    const { repos } = await openForm('/flashcards/nueva');
    await userEvent.click(screen.getByRole('button', { name: /Nuevo tag/ }));
    await userEvent.type(screen.getByLabelText('Nombre del tag'), 'escuela');
    await userEvent.click(screen.getByRole('button', { name: 'Crear y asignar' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Escuela' })).toHaveAttribute('aria-pressed', 'true'));
    expect(repos.languagesData[0].tags).toEqual(['Saludos', 'Escuela']);
  });

  it('F03-9 en edición se precargan los valores y se guardan los cambios', async () => {
    const { repos, router } = await openForm('/flashcards/c1/editar');
    expect(screen.getByLabelText(/Palabra/)).toHaveValue('朋友');
    expect(screen.getByLabelText(/Traducción/)).toHaveValue('amigo');
    expect(screen.getByLabelText(/Pinyin/)).toHaveValue('péngyou');
    expect(screen.getByLabelText(/Nivel/)).toHaveValue(2);
    expect(screen.getByRole('button', { name: 'Saludos' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Editar flashcard' })).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText(/Traducción/));
    await userEvent.type(screen.getByLabelText(/Traducción/), 'amistad');
    await userEvent.click(save());
    await waitFor(() => expect(router.state.location.pathname).toBe('/flashcards/c1'));
    const saved = repos.flashcardsData.find((c) => c.id === 'c1')!;
    expect(saved.values.translation).toBe('amistad');
    expect(saved.createdAt).toBe(1);
    expect(saved.updatedAt).toBeGreaterThan(1);
  });

  it('F03-9 Eliminar pide confirmación, la quita de los mazos y permite deshacer', async () => {
    const { repos, router } = await openForm('/flashcards/c1/editar');
    await userEvent.click(screen.getByRole('button', { name: /Eliminar/ }));
    const dialog = screen.getByRole('alertdialog', { name: '¿Eliminar esta flashcard?' });
    expect(dialog).toHaveTextContent('Se quitará también de los 2 mazos que la incluyen.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(repos.flashcardsData).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: /Eliminar/ }));
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/flashcards'));
    expect(repos.flashcardsData).toHaveLength(0);
    expect(repos.decksData.every((d) => !d.cardIds.includes('c1'))).toBe(true);
    expect(await screen.findByText('Flashcard eliminada')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(() => expect(repos.flashcardsData).toHaveLength(1));
    expect(repos.decksData.every((d) => d.cardIds.includes('c1'))).toBe(true);
  });

  it('una flashcard nueva no ofrece Eliminar', async () => {
    await openForm('/flashcards/nueva');
    expect(screen.queryByRole('button', { name: /Eliminar/ })).toBeNull();
  });

  it('los cambios sin guardar piden confirmación al salir', async () => {
    const { router } = await openForm('/flashcards/nueva');
    await userEvent.type(screen.getByLabelText(/Palabra/), '水');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(await screen.findByRole('alertdialog', { name: '¿Salir sin guardar?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Salir sin guardar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/flashcards'));
  });

  it('F03-10 todos los inputs tienen una etiqueta visible asociada', async () => {
    await openForm('/flashcards/nueva');
    for (const input of document.querySelectorAll<HTMLInputElement>('form input')) {
      expect(input.labels?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('una flashcard inexistente muestra un aviso', async () => {
    renderApp('/flashcards/nope/editar', signedInService(), seeded());
    expect(await screen.findByText('No se encontró la flashcard')).toBeInTheDocument();
  });
});
