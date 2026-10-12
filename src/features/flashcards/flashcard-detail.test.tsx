import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { card, chinese, deck } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

function seeded() {
  const repos = new MemoryRepositories();
  repos.languagesData = [chinese()];
  repos.flashcardsData = [card('c1', 'zh', { values: { word: '朋友', translation: 'amigo', pinyin: 'péngyou' }, tags: ['Saludos', 'Escuela'] })];
  repos.decksData = [deck('d1', 'zh', { cardIds: ['c1'] }), deck('d2', 'zh', { name: 'HSK 1 · Semana 1', cardIds: ['c1'] }), deck('d3', 'zh', { name: 'Otro', cardIds: [] })];
  return repos;
}

async function openDetail(repos = seeded()) {
  const view = renderApp('/flashcards/c1', signedInService(), repos);
  await screen.findByRole('heading', { name: 'Campos' });
  return { ...view, repos };
}

const fields = () => within(screen.getByRole('region', { name: 'Campos' }));

function mockSpeech(voices: { lang: string }[]) {
  const speakSpy = vi.fn();
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: { getVoices: () => voices, cancel: vi.fn(), speak: speakSpy },
  });
  class Utterance { lang = ''; constructor(public text: string) {} }
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
  return speakSpy;
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(window, 'speechSynthesis');
});

describe('F04 · Detalle de flashcard', () => {
  it('F04-1 muestra todos los campos de la flashcard con sus valores y tags', async () => {
    await openDetail();
    const list = fields();
    expect(list.getByText('Palabra')).toBeInTheDocument();
    expect(list.getByText('朋友')).toBeInTheDocument();
    expect(list.getByText('péngyou')).toBeInTheDocument();
    expect(list.getByText('amigo')).toBeInTheDocument();
    expect(list.getByText('Saludos')).toBeInTheDocument();
    expect(list.getByText('Escuela')).toBeInTheDocument();
  });

  it('F04-2 la vista previa gira al tocarla y con Enter/Espacio, y permite cambiar de layout', async () => {
    await openDetail();
    const flip = screen.getByRole('button', { name: 'Girar carta. Mostrando el frente' });
    await userEvent.click(flip);
    expect(screen.getByRole('button', { name: 'Girar carta. Mostrando el reverso' })).toHaveClass('is-flipped');
    flip.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Girar carta. Mostrando el frente' })).not.toHaveClass('is-flipped');
    await userEvent.keyboard(' ');
    expect(screen.getByRole('button', { name: 'Girar carta. Mostrando el reverso' })).toBeInTheDocument();

    const seg = screen.getByRole('group', { name: 'Layout de vista previa' });
    expect(within(seg).getByRole('button', { name: 'Palabra y pinyin' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(within(seg).getByRole('button', { name: 'Solo traducción' }));
    expect(within(seg).getByRole('button', { name: 'Solo traducción' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('el frente respeta el layout elegido (campos y tamaños)', async () => {
    await openDetail();
    const front = document.querySelector('.face:not(.back)') as HTMLElement;
    expect(within(front).getByText('朋友')).toBeInTheDocument();
    expect(front.querySelector('[data-field="pinyin"]')).toHaveTextContent('péngyou');
    expect(front.querySelector('[data-field="translation"]')).toBeNull();
    const back = document.querySelector('.face.back') as HTMLElement;
    expect(back.querySelector('[data-field="translation"]')).toHaveTextContent('amigo');
  });

  it('F04-3 los campos con TTS tienen un botón que reproduce el audio; los demás no', async () => {
    const speakSpy = mockSpeech([{ lang: 'zh-CN' }]);
    await openDetail();
    const list = fields();
    expect(list.getByRole('button', { name: 'Escuchar palabra' })).toBeInTheDocument();
    expect(list.queryByRole('button', { name: 'Escuchar pinyin' })).toBeNull();
    expect(list.queryByRole('button', { name: 'Escuchar traducción' })).toBeNull();
    await userEvent.click(list.getByRole('button', { name: 'Escuchar palabra' }));
    expect(speakSpy).toHaveBeenCalledOnce();
    expect(speakSpy.mock.calls[0][0]).toMatchObject({ text: '朋友', lang: 'zh-CN' });
  });

  it('tocar el audio de la vista previa no gira la carta', async () => {
    mockSpeech([{ lang: 'zh-CN' }]);
    await openDetail();
    const front = document.querySelector('.face:not(.back)') as HTMLElement;
    await userEvent.click(within(front).getByRole('button', { name: 'Escuchar palabra', hidden: true }));
    expect(screen.getByRole('button', { name: 'Girar carta. Mostrando el frente' })).not.toHaveClass('is-flipped');
  });

  it('avisa si el dispositivo no tiene voz para el idioma', async () => {
    mockSpeech([{ lang: 'en-US' }]);
    await openDetail();
    await userEvent.click(fields().getByRole('button', { name: 'Escuchar palabra' }));
    expect(await screen.findByText('Tu dispositivo no tiene voz para este idioma')).toBeInTheDocument();
  });

  it('F04-4 Editar abre el formulario precargado', async () => {
    const { router } = await openDetail();
    await userEvent.click(screen.getAllByRole('link', { name: /Editar/ })[0]);
    await waitFor(() => expect(router.state.location.pathname).toBe('/flashcards/c1/editar'));
    expect(await screen.findByLabelText(/Palabra/)).toHaveValue('朋友');
  });

  it('F04-4 Eliminar requiere confirmación', async () => {
    const { repos, router } = await openDetail();
    await userEvent.click(screen.getAllByRole('button', { name: /Eliminar/ })[0]);
    const dialog = await screen.findByRole('alertdialog', { name: '¿Eliminar esta flashcard?' });
    expect(dialog).toHaveTextContent('2 mazos');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(repos.flashcardsData).toHaveLength(1);
    await userEvent.click(screen.getAllByRole('button', { name: /Eliminar/ })[0]);
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/flashcards'));
    expect(repos.flashcardsData).toHaveLength(0);
  });

  it('F04-5 lista los mazos que contienen la flashcard con enlace a cada uno', async () => {
    await openDetail();
    const links = fields().getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Saludos básicos', 'HSK 1 · Semana 1']);
    expect(links[0]).toHaveAttribute('href', '/mazos/d1');
    expect(screen.getByText(/Aparece en 2 mazos/)).toBeInTheDocument();
  });

  it('sin mazos lo indica', async () => {
    const repos = seeded();
    repos.decksData = [];
    await openDetail(repos);
    expect(screen.getByText('No aparece en ningún mazo.')).toBeInTheDocument();
  });

  it('un idioma sin layouts no tiene vista previa y ofrece crear uno', async () => {
    const repos = seeded();
    repos.languagesData = [chinese({ layouts: [] })];
    await openDetail(repos);
    expect(screen.getByText(/todavía no tiene layouts/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Girar carta/ })).toBeNull();
  });
});
