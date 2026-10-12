import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AiCompleter, AiRequest, AiResponse } from '@/lib/domain/ai-completion';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { chinese } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

const RESPONSE: AiResponse = { values: { pinyin: 'péngyou', translation: 'amigo' }, tags: ['Saludos', 'Escuela', 'Inventado'] };

function fakeAi(handler: (request: AiRequest) => Promise<AiResponse> = async () => RESPONSE) {
  const complete = vi.fn(handler);
  const ai: AiCompleter = { complete };
  return { ai, complete };
}

async function openForm(ai?: AiCompleter, path = '/flashcards/nueva', repos = new MemoryRepositories()) {
  repos.languagesData = [chinese()];
  const view = renderApp(path, signedInService(), repos, ai);
  await screen.findByLabelText(/Palabra/);
  return { ...view, repos };
}

const aiButton = () => screen.getByRole('button', { name: /completar/i });

describe('F03 · Completar con IA', () => {
  afterEach(() => vi.restoreAllMocks());

  it('F03-5 el botón está deshabilitado con la palabra vacía y se habilita al escribirla', async () => {
    const { ai } = fakeAi();
    await openForm(ai);
    expect(aiButton()).toBeDisabled();
    expect(screen.getByText(/Escribe la palabra y usa la IA/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Palabra/), '朋友');
    expect(aiButton()).toBeEnabled();
    await userEvent.clear(screen.getByLabelText(/Palabra/));
    expect(aiButton()).toBeDisabled();
  });

  it('sin servicio de IA el botón no se muestra', async () => {
    await openForm();
    expect(screen.queryByRole('button', { name: /completar/i })).toBeNull();
  });

  it('F03-6 rellena los campos vacíos y asigna solo tags existentes (máx. 2)', async () => {
    const { ai, complete } = fakeAi();
    await openForm(ai);
    await userEvent.type(screen.getByLabelText(/Palabra/), '朋友');
    await userEvent.type(screen.getByLabelText(/Traducción/), 'compañero');
    await userEvent.click(aiButton());

    await waitFor(() => expect(screen.getByLabelText(/Pinyin/)).toHaveValue('péngyou'));
    expect(screen.getByLabelText(/Traducción/)).toHaveValue('compañero');
    expect(screen.getByLabelText(/Palabra/)).toHaveValue('朋友');

    const request = complete.mock.calls[0][0];
    expect(request).toMatchObject({ word: '朋友', languageName: 'Chino mandarín', tags: ['Saludos', 'Escuela'] });
    expect(request.fields.map((f) => f.id)).toEqual(['pinyin', 'translation']);

    const tags = within(screen.getByRole('group', { name: 'Tags' }));
    expect(tags.getByRole('button', { name: 'Saludos' })).toHaveAttribute('aria-pressed', 'true');
    expect(tags.getByRole('button', { name: 'Escuela' })).toHaveAttribute('aria-pressed', 'true');
    expect(tags.queryByRole('button', { name: 'Inventado' })).toBeNull();
  });

  it('F03-7 indica que viene de IA, se puede editar y se guarda lo editado', async () => {
    const { ai } = fakeAi();
    const { repos, router } = await openForm(ai);
    await userEvent.type(screen.getByLabelText(/Palabra/), '朋友');
    await userEvent.click(aiButton());

    expect(await screen.findByText(/Completado con IA\./)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pinyin/)).toHaveClass('from-ai');
    expect(screen.getAllByText(/Completado con IA: revísalo/, { selector: '.help' })).toHaveLength(2);
    expect(screen.getByLabelText(/Palabra/)).not.toHaveClass('from-ai');
    expect(screen.getByRole('button', { name: 'Completar de nuevo' })).toBeEnabled();

    await userEvent.clear(screen.getByLabelText(/Traducción/));
    await userEvent.type(screen.getByLabelText(/Traducción/), 'amigo/a');
    expect(screen.getByLabelText(/Traducción/)).not.toHaveClass('from-ai');

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/flashcards'));
    expect(repos.flashcardsData.at(-1)).toMatchObject({ values: { word: '朋友', pinyin: 'péngyou', translation: 'amigo/a' }, tags: ['Saludos', 'Escuela'] });
  });

  it('mientras espera a la IA muestra los campos como esqueleto y deshabilitados', async () => {
    let resolve!: (r: AiResponse) => void;
    const { ai } = fakeAi(() => new Promise<AiResponse>((r) => { resolve = r; }));
    await openForm(ai);
    await userEvent.type(screen.getByLabelText(/Palabra/), '朋友');
    await userEvent.click(aiButton());

    expect(screen.getByRole('button', { name: 'Completando…' })).toBeDisabled();
    expect(screen.getByLabelText(/Pinyin/)).toBeDisabled();
    expect(screen.getByLabelText(/Pinyin/)).toHaveClass('skeleton');
    expect(screen.getByLabelText(/Palabra/)).toBeDisabled();

    await act(async () => { resolve(RESPONSE); });
    await waitFor(() => expect(screen.getByLabelText(/Pinyin/)).toBeEnabled());
    expect(screen.getByLabelText(/Pinyin/)).toHaveValue('péngyou');
  });

  it('F03-8 un fallo muestra el error con reintento y no bloquea el llenado manual', async () => {
    let calls = 0;
    const { ai, complete } = fakeAi(async () => {
      calls += 1;
      if (calls === 1) throw new Error('boom');
      return RESPONSE;
    });
    await openForm(ai);
    await userEvent.type(screen.getByLabelText(/Palabra/), '朋友');
    await userEvent.click(aiButton());

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No se pudo completar con IA. Puedes reintentar o llenar los campos a mano.');
    expect(screen.getByLabelText(/Traducción/)).toBeEnabled();
    await userEvent.type(screen.getByLabelText(/Traducción/), 'amigo');
    expect(screen.getByLabelText(/Traducción/)).toHaveValue('amigo');

    await userEvent.click(within(alert).getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(screen.getByLabelText(/Pinyin/)).toHaveValue('péngyou'));
    expect(complete).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/No se pudo completar con IA/)).toBeNull();
  });

  it('completar de nuevo reemplaza lo que puso la IA pero respeta lo que editó el usuario', async () => {
    let calls = 0;
    const { ai } = fakeAi(async () => (++calls === 1 ? RESPONSE : { values: { pinyin: 'péng you', translation: 'amigo/a' }, tags: ['Escuela'] }));
    await openForm(ai);
    await userEvent.type(screen.getByLabelText(/Palabra/), '朋友');
    await userEvent.click(aiButton());
    await waitFor(() => expect(screen.getByLabelText(/Pinyin/)).toHaveValue('péngyou'));
    await userEvent.clear(screen.getByLabelText(/Traducción/));
    await userEvent.type(screen.getByLabelText(/Traducción/), 'colega');
    await userEvent.click(screen.getByRole('button', { name: 'Completar de nuevo' }));
    await waitFor(() => expect(screen.getByLabelText(/Pinyin/)).toHaveValue('péng you'));
    expect(screen.getByLabelText(/Traducción/)).toHaveValue('colega');
    const tags = within(screen.getByRole('group', { name: 'Tags' }));
    expect(tags.getByRole('button', { name: 'Escuela' })).toHaveAttribute('aria-pressed', 'true');
    expect(tags.getByRole('button', { name: 'Saludos' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('avisa si la IA no tenía nada nuevo que completar', async () => {
    const { ai } = fakeAi(async () => ({ values: {}, tags: [] }));
    await openForm(ai);
    await userEvent.type(screen.getByLabelText(/Palabra/), '朋友');
    await userEvent.click(aiButton());
    expect(await screen.findByText(/La IA no tenía nada nuevo/)).toBeInTheDocument();
  });

  it('A04-3 sin conexión el botón queda deshabilitado y explica el motivo', async () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    const { ai, complete } = fakeAi();
    await openForm(ai);
    await userEvent.type(screen.getByLabelText(/Palabra/), '朋友');
    expect(aiButton()).toBeEnabled();

    onLine.mockReturnValue(false);
    act(() => { window.dispatchEvent(new Event('offline')); });
    await waitFor(() => expect(aiButton()).toBeDisabled());
    expect(screen.getByText('Requiere conexión para completar con IA.')).toBeInTheDocument();
    expect(aiButton()).toHaveAccessibleDescription('Requiere conexión para completar con IA.');
    expect(complete).not.toHaveBeenCalled();

    onLine.mockReturnValue(true);
    act(() => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(aiButton()).toBeEnabled());
  });

  it('en edición el botón dice "Volver a completar con IA" y no pisa los campos con contenido', async () => {
    const { ai } = fakeAi();
    const repos = new MemoryRepositories();
    repos.flashcardsData = [{ id: 'c1', languageId: 'zh', values: { word: '朋友', translation: 'amigo' }, tags: [], createdAt: 1, updatedAt: 1 }];
    await openForm(ai, '/flashcards/c1/editar', repos);
    await userEvent.click(screen.getByRole('button', { name: 'Volver a completar con IA' }));
    await waitFor(() => expect(screen.getByLabelText(/Pinyin/)).toHaveValue('péngyou'));
    expect(screen.getByLabelText(/Traducción/)).toHaveValue('amigo');
  });
});
