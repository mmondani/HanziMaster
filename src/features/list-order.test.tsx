import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { card, chinese, deck, MODE_A } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

function seeded() {
  const repos = new MemoryRepositories();
  repos.languagesData = [chinese()];
  repos.flashcardsData = [
    card('c1', 'zh', { values: { word: '一', translation: 'uno' }, createdAt: 100 }),
    card('c2', 'zh', { values: { word: '二', translation: 'dos' }, createdAt: 300 }),
    card('c3', 'zh', { values: { word: '三', translation: 'tres' }, createdAt: 200 }),
  ];
  repos.decksData = [
    deck('d1', 'zh', { name: 'Viejo', cardIds: ['c1'], modes: [MODE_A] }),
    deck('d2', 'zh', { name: 'Medio', cardIds: ['c1'], modes: [MODE_A], createdAt: 200 }),
    deck('d3', 'zh', { name: 'Nuevo', cardIds: ['c1'], modes: [MODE_A], createdAt: 300 }),
  ];
  return repos;
}

const words = () => Array.from(document.querySelectorAll('.card-row .lead')).map((n) => n.textContent);
const deckNames = () => Array.from(document.querySelectorAll('.deck-card h2')).map((n) => n.textContent);

describe('MJ1 · Orden por fecha de creación en los listados', () => {
  it('MJ1-4 las flashcards se ordenan por fecha: más recientes primero por defecto y se puede invertir', async () => {
    const { router } = renderApp('/flashcards', signedInService(), seeded());
    await screen.findByText('一');
    expect(words()).toEqual(['二', '三', '一']);
    await userEvent.selectOptions(screen.getByLabelText('Ordenar por fecha de creación'), 'oldest');
    expect(words()).toEqual(['一', '三', '二']);
    expect(router.state.location.search).toBe('?orden=antiguas');
  });

  it('MJ1-5 abrir la URL con ?orden=antiguas aplica el orden', async () => {
    renderApp('/flashcards?orden=antiguas', signedInService(), seeded());
    await screen.findByText('一');
    expect(words()).toEqual(['一', '三', '二']);
    expect(screen.getByLabelText('Ordenar por fecha de creación')).toHaveValue('oldest');
  });

  it('MJ1-6 los mazos se ordenan por fecha; el mazo sin fecha cuenta como el más antiguo', async () => {
    renderApp('/mazos', signedInService(), seeded());
    await screen.findByText('Viejo');
    expect(deckNames()).toEqual(['Nuevo', 'Medio', 'Viejo']);
    await userEvent.selectOptions(screen.getByLabelText('Ordenar por fecha de creación'), 'oldest');
    await waitFor(() => expect(deckNames()).toEqual(['Viejo', 'Medio', 'Nuevo']));
  });
});

describe('MJ2 · Paginación en los listados', () => {
  function manyCards(n: number) {
    const repos = new MemoryRepositories();
    repos.languagesData = [chinese()];
    repos.flashcardsData = Array.from({ length: n }, (_, i) =>
      card(`c${i + 1}`, 'zh', { values: { word: `P${i + 1}`, translation: `t${i + 1}` }, createdAt: i + 1 }));
    return repos;
  }

  it('MJ2-6 las flashcards se paginan de a 50: la página 2 muestra el resto y refleja ?pagina= en la URL', async () => {
    const { router } = renderApp('/flashcards?orden=antiguas', signedInService(), manyCards(120));
    await screen.findByText('P1');
    expect(words()).toHaveLength(50);
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(screen.getByRole('button', { name: 'Página 3' }));
    expect(words()).toHaveLength(20);
    expect(words()[0]).toBe('P101');
    expect(router.state.location.search).toBe('?orden=antiguas&pagina=3');
  });

  it('MJ2-7 buscar o cambiar el orden vuelve a la primera página', async () => {
    renderApp('/flashcards?pagina=2', signedInService(), manyCards(120));
    await screen.findByRole('button', { name: 'Página 2' });
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');
    await userEvent.selectOptions(screen.getByLabelText('Ordenar por fecha de creación'), 'oldest');
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page');
  });

  it('MJ2-8 una página fuera de rango muestra la última y con pocas flashcards no hay paginador', async () => {
    renderApp('/flashcards?pagina=99', signedInService(), manyCards(120));
    await screen.findByRole('button', { name: 'Página 3' });
    expect(screen.getByRole('button', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page');
  });

  it('MJ2-9 con pocas flashcards no hay paginador', async () => {
    renderApp('/flashcards', signedInService(), manyCards(5));
    await screen.findByText('P1');
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).toBeNull();
  });

  it('MJ2-10 los mazos se paginan de a 12', async () => {
    const repos = new MemoryRepositories();
    repos.languagesData = [chinese()];
    repos.decksData = Array.from({ length: 25 }, (_, i) => deck(`d${i + 1}`, 'zh', { name: `Mazo ${i + 1}`, cardIds: ['c1'], modes: [MODE_A], createdAt: i + 1 }));
    renderApp('/mazos', signedInService(), repos);
    await screen.findByText('Mazo 25');
    expect(deckNames()).toHaveLength(12);
    await userEvent.click(screen.getByRole('button', { name: 'Página 3' }));
    expect(deckNames()).toEqual(['Mazo 1']);
  });
});
