import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { card, chinese, deck, MODE_A, MODE_B } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

const WORDS = [
  ['你好', 'nǐ hǎo', 'hola'],
  ['谢谢', 'xièxie', 'gracias'],
  ['学生', 'xuésheng', 'estudiante'],
] as const;

function seeded(count = 3) {
  const repos = new MemoryRepositories();
  repos.languagesData = [chinese()];
  repos.flashcardsData = Array.from({ length: count }, (_, i) => {
    const [w, p, t] = WORDS[i % WORDS.length];
    return card(`c${i}`, 'zh', { values: { word: `${w}${i}`, pinyin: `${p}${i}`, translation: `${t}${i}` }, tags: ['Saludos'] });
  });
  repos.decksData = [
    deck('d1', 'zh', { name: 'Saludos básicos', cardIds: repos.flashcardsData.map((c) => c.id), modes: [MODE_A, MODE_B] }),
    deck('d2', 'zh', { name: 'Roto', cardIds: ['c0'], modes: [{ ...MODE_A, frontLayoutId: 'borrado' }] }),
    deck('d3', 'zh', { name: 'Vacío', cardIds: [], modes: [MODE_A] }),
  ];
  return repos;
}

/** Con `Math.random` casi 1, la mezcla Fisher-Yates deja el orden original (determinista). */
function identityOrder() {
  vi.spyOn(Math, 'random').mockReturnValue(0.999999);
}

async function openStudy(path = '/mazos/d1/estudiar?modo=mA', repos = seeded()) {
  const view = renderApp(path, signedInService(), repos);
  await screen.findByRole('progressbar');
  return { ...view, repos };
}

const counter = () => screen.getByText(/^\d+ \/ \d+$/);
const front = () => document.querySelector('.face:not(.back)') as HTMLElement;
const back = () => document.querySelector('.face.back') as HTMLElement;
const flipCard = () => screen.getByRole('button', { name: /Girar carta/ });
const stage = () => document.querySelector('.study-stage') as HTMLElement;

function mockSpeech() {
  const speakSpy = vi.fn();
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { getVoices: () => [{ lang: 'zh-CN' }], cancel: vi.fn(), speak: speakSpy } });
  vi.stubGlobal('SpeechSynthesisUtterance', class { lang = ''; constructor(public text: string) {} });
  return speakSpy;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(window, 'speechSynthesis');
});

describe('R01 · Frente de la carta', () => {
  it('R01-1 muestra el nombre del mazo, el modo, el contador y el frente de la primera carta con su layout', async () => {
    identityOrder();
    await openStudy();
    expect(screen.getByRole('heading', { name: 'Saludos básicos' })).toBeInTheDocument();
    expect(screen.getByText('Palabra → Significado · Libre')).toBeInTheDocument();
    expect(counter()).toHaveTextContent('1 / 3');
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    expect(bar).toHaveAttribute('aria-valuemax', '3');
    expect(within(front()).getByText('你好0')).toBeInTheDocument();
    expect(within(front()).getByText('nǐ hǎo0')).toBeInTheDocument();
    expect(within(front()).queryByText('hola0')).toBeNull();
  });

  it('R01-1 recorre todas las cartas en orden aleatorio, sin repetir ni omitir', async () => {
    await openStudy('/mazos/d1/estudiar?modo=mA', seeded(8));
    const seen: string[] = [];
    for (let i = 0; i < 8; i++) {
      seen.push((front().querySelector('[data-field="word"]') as HTMLElement).textContent!);
      await userEvent.keyboard('{ArrowRight}');
    }
    expect(new Set(seen).size).toBe(8);
    expect(await screen.findByRole('dialog', { name: '¡Terminaste el mazo!' })).toBeInTheDocument();
  });

  it('R01-2 un clic en la carta la gira y muestra el reverso; otro la devuelve al frente', async () => {
    identityOrder();
    await openStudy();
    expect(flipCard()).toHaveAccessibleName('Girar carta. Mostrando el frente');
    await userEvent.click(flipCard());
    expect(flipCard()).toHaveAccessibleName('Girar carta. Mostrando el reverso');
    expect(flipCard()).toHaveClass('is-flipped');
    expect(within(back()).getByText('hola0')).toBeInTheDocument();
    await userEvent.click(flipCard());
    expect(flipCard()).not.toHaveClass('is-flipped');
  });

  it('el botón Girar también gira la carta', async () => {
    identityOrder();
    await openStudy();
    await userEvent.click(screen.getByRole('button', { name: 'Girar' }));
    expect(flipCard()).toHaveClass('is-flipped');
  });

  it('R01-3 en PC las flechas del teclado navegan y los botones en pantalla hacen lo mismo', async () => {
    identityOrder();
    await openStudy();
    await userEvent.keyboard('{ArrowRight}');
    expect(counter()).toHaveTextContent('2 / 3');
    await userEvent.keyboard('{ArrowLeft}');
    expect(counter()).toHaveTextContent('1 / 3');
    await userEvent.click(screen.getByRole('button', { name: 'Carta siguiente' }));
    expect(counter()).toHaveTextContent('2 / 3');
    await userEvent.click(screen.getByRole('button', { name: 'Carta anterior' }));
    expect(counter()).toHaveTextContent('1 / 3');
  });

  it('el botón anterior está deshabilitado en la primera carta y ← no hace nada', async () => {
    identityOrder();
    await openStudy();
    expect(screen.getByRole('button', { name: 'Carta anterior' })).toBeDisabled();
    await userEvent.keyboard('{ArrowLeft}');
    expect(counter()).toHaveTextContent('1 / 3');
  });

  it('Espacio y Enter giran la carta cuando nada tiene el foco', async () => {
    identityOrder();
    await openStudy();
    await userEvent.keyboard(' ');
    expect(flipCard()).toHaveClass('is-flipped');
    await userEvent.keyboard('{Enter}');
    expect(flipCard()).not.toHaveClass('is-flipped');
  });

  it('R01-8 la carta es operable con teclado y anuncia la cara visible', async () => {
    identityOrder();
    await openStudy();
    flipCard().focus();
    expect(flipCard()).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(flipCard()).toHaveAccessibleName('Girar carta. Mostrando el reverso');
    await userEvent.keyboard(' ');
    expect(flipCard()).toHaveAccessibleName('Girar carta. Mostrando el frente');
  });

  it('R01-4 en mobile, el swipe a la izquierda avanza y a la derecha retrocede', async () => {
    identityOrder();
    await openStudy();
    const swipe = (from: number, to: number, y = 0) => {
      fireEvent.touchStart(stage(), { touches: [{ clientX: from, clientY: 0 }] });
      fireEvent.touchEnd(stage(), { changedTouches: [{ clientX: to, clientY: y }] });
    };
    swipe(250, 100);
    expect(counter()).toHaveTextContent('2 / 3');
    swipe(100, 250);
    expect(counter()).toHaveTextContent('1 / 3');
  });

  it('un gesto corto o más vertical que horizontal no navega', async () => {
    identityOrder();
    await openStudy();
    fireEvent.touchStart(stage(), { touches: [{ clientX: 200, clientY: 0 }] });
    fireEvent.touchEnd(stage(), { changedTouches: [{ clientX: 160, clientY: 0 }] });
    fireEvent.touchStart(stage(), { touches: [{ clientX: 200, clientY: 0 }] });
    fireEvent.touchEnd(stage(), { changedTouches: [{ clientX: 100, clientY: 300 }] });
    expect(counter()).toHaveTextContent('1 / 3');
  });

  it('R01-5 cada carta nueva se muestra por el frente y se actualizan el contador y la barra', async () => {
    identityOrder();
    await openStudy();
    await userEvent.click(flipCard());
    await userEvent.keyboard('{ArrowRight}');
    expect(flipCard()).toHaveAccessibleName('Girar carta. Mostrando el frente');
    expect(counter()).toHaveTextContent('2 / 3');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');
    expect(within(front()).getByText('谢谢1')).toBeInTheDocument();
  });

  it('R01-6 los campos con audio tienen un ícono que reproduce el texto sin girar la carta; los demás no', async () => {
    identityOrder();
    const speakSpy = mockSpeech();
    await openStudy();
    const audio = within(front()).getByRole('button', { name: 'Escuchar palabra', hidden: true });
    await userEvent.click(audio);
    expect(speakSpy).toHaveBeenCalledOnce();
    expect(speakSpy.mock.calls[0][0]).toMatchObject({ text: '你好0', lang: 'zh-CN' });
    expect(flipCard()).not.toHaveClass('is-flipped');
    expect(within(front()).queryAllByRole('button', { name: /Escuchar pinyin/, hidden: true })).toHaveLength(0);
    expect(within(back()).queryAllByRole('button', { name: /Escuchar/, hidden: true })).toHaveLength(0);
  });

  it('avisa si el dispositivo no tiene voz para el idioma', async () => {
    identityOrder();
    await openStudy();
    await userEvent.click(within(front()).getByRole('button', { name: 'Escuchar palabra', hidden: true }));
    expect(await screen.findByText('Tu dispositivo no tiene voz para este idioma')).toBeInTheDocument();
  });

  it('el modo elegido determina el frente y el reverso', async () => {
    identityOrder();
    await openStudy('/mazos/d1/estudiar?modo=mB');
    expect(screen.getByText('Significado → Palabra · Libre')).toBeInTheDocument();
    expect(within(front()).getByText('hola0')).toBeInTheDocument();
    expect(within(front()).queryByText('你好0')).toBeNull();
    await userEvent.click(flipCard());
    expect(within(back()).getByText('你好0')).toBeInTheDocument();
  });
});

describe('R02 · Reverso de la carta', () => {
  it('R02-1 el reverso muestra exactamente los campos del layout de reverso del modo', async () => {
    identityOrder();
    await openStudy();
    await userEvent.click(flipCard());
    expect(back().querySelectorAll('[data-field]')).toHaveLength(1);
    expect(back().querySelector('[data-field="translation"]')).toHaveTextContent('hola0');
    expect(back().querySelector('[data-field="word"]')).toBeNull();
    expect(back().querySelector('[data-field="pinyin"]')).toBeNull();
  });
});

describe('R03 · Fin del mazo', () => {
  async function finish(count = 3) {
    identityOrder();
    const view = await openStudy('/mazos/d1/estudiar?modo=mA', seeded(count));
    for (let i = 0; i < count; i++) await userEvent.keyboard('{ArrowRight}');
    const dialog = await screen.findByRole('dialog', { name: '¡Terminaste el mazo!' });
    return { ...view, dialog: within(dialog) };
  }

  it('R03-1 al avanzar desde la última carta se pregunta si volver a mezclar o salir', async () => {
    const { dialog } = await finish();
    expect(dialog.getByText('Recorriste las 3 flashcards de «Saludos básicos».')).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: /Volver a mezclar/ })).toHaveFocus();
    expect(dialog.getByRole('button', { name: 'Salir' })).toBeInTheDocument();
  });

  it('el diálogo del fin no se cierra con Esc ni con el fondo', async () => {
    await finish();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: '¡Terminaste el mazo!' })).toBeInTheDocument();
    await userEvent.click(document.querySelector('.overlay')!);
    expect(screen.getByRole('dialog', { name: '¡Terminaste el mazo!' })).toBeInTheDocument();
  });

  it('R03-2 Volver a mezclar reinicia el recorrido con un orden distinto', async () => {
    const { dialog } = await finish();
    await userEvent.click(dialog.getByRole('button', { name: /Volver a mezclar/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(counter()).toHaveTextContent('1 / 3');
    expect(flipCard()).toHaveAccessibleName('Girar carta. Mostrando el frente');
    // Antes la primera era 你好0; el nuevo orden es distinto.
    expect(within(front()).queryByText('你好0')).toBeNull();
  });

  it('R03-2 Salir vuelve a la lista de mazos', async () => {
    const { dialog, router } = await finish();
    await userEvent.click(dialog.getByRole('button', { name: 'Salir' }));
    expect(router.state.location.pathname).toBe('/mazos');
  });

  it('un mazo de una carta termina al avanzar', async () => {
    await finish(1);
    expect(screen.getByText('Recorriste la flashcard de «Saludos básicos».')).toBeInTheDocument();
  });
});

describe('R01 · Salir', () => {
  it('R01-7 la ✕ pide confirmación y permite seguir estudiando o salir', async () => {
    identityOrder();
    const { router } = await openStudy();
    await userEvent.click(screen.getByRole('button', { name: 'Salir del recorrido' }));
    const dialog = within(screen.getByRole('alertdialog', { name: '¿Salir del recorrido?' }));
    expect(dialog.getByText(/No se guarda el avance/)).toBeInTheDocument();
    await userEvent.click(dialog.getByRole('button', { name: 'Seguir estudiando' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(router.state.location.pathname).toBe('/mazos/d1/estudiar');
    await userEvent.click(screen.getByRole('button', { name: 'Salir del recorrido' }));
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Salir' }));
    expect(router.state.location.pathname).toBe('/mazos');
  });

  it('R01-7 Esc abre la confirmación para salir', async () => {
    identityOrder();
    await openStudy();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog', { name: '¿Salir del recorrido?' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('con un diálogo abierto, las flechas y los gestos no navegan', async () => {
    identityOrder();
    await openStudy();
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{ArrowRight}');
    fireEvent.touchStart(stage(), { touches: [{ clientX: 250, clientY: 0 }] });
    fireEvent.touchEnd(stage(), { changedTouches: [{ clientX: 100, clientY: 0 }] });
    await userEvent.keyboard('{Escape}');
    expect(counter()).toHaveTextContent('1 / 3');
  });

  it('el recorrido está fuera del shell: sin sidebar ni barra inferior', async () => {
    identityOrder();
    await openStudy();
    expect(document.querySelector('.sidebar')).toBeNull();
    expect(document.querySelector('.bottom-nav')).toBeNull();
  });
});

describe('Estados especiales', () => {
  it('un mazo no disponible (layout eliminado) no se recorre', async () => {
    renderApp('/mazos/d2/estudiar?modo=mA', signedInService(), seeded());
    expect(await screen.findByText(/Este mazo no está disponible/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al mazo' })).toHaveAttribute('href', '/mazos/d2');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('un mazo vacío no se recorre', async () => {
    renderApp('/mazos/d3/estudiar?modo=mA', signedInService(), seeded());
    expect(await screen.findByText('Este mazo no tiene flashcards.')).toBeInTheDocument();
  });

  it('un modo inexistente se informa', async () => {
    renderApp('/mazos/d1/estudiar?modo=nope', signedInService(), seeded());
    expect(await screen.findByText('No se encontró el modo de recorrida elegido.')).toBeInTheDocument();
  });

  it('un mazo inexistente muestra un aviso', async () => {
    renderApp('/mazos/nope/estudiar?modo=mA', signedInService(), seeded());
    expect(await screen.findByText('No se encontró el mazo')).toBeInTheDocument();
  });

  it('muestra el error de carga con Reintentar', async () => {
    const repos = seeded();
    repos.languagesError = new Error('x');
    renderApp('/mazos/d1/estudiar?modo=mA', signedInService(), repos);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el mazo');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument());
  });
});
