import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { card, chinese, deck } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

function seeded() {
  const repos = new MemoryRepositories();
  repos.languagesData = [chinese(), chinese({ id: 'ja', name: 'Japonés', code: 'ja-JP', tags: [], layouts: [] })];
  repos.flashcardsData = [card('c1', 'zh'), card('c2', 'zh'), card('c3', 'ja')];
  repos.decksData = [deck('d1', 'zh')];
  return repos;
}

describe('G01 · Más', () => {
  it('G01-1 muestra el email de la cuenta de Google conectada', async () => {
    renderApp('/mas', signedInService(), seeded());
    const account = await screen.findByRole('region', { name: 'Cuenta' });
    expect(account).toHaveTextContent('ana@gmail.com');
  });

  it('G01-2 Idiomas abre I01 y Cerrar sesión lleva a A01', async () => {
    const { router } = renderApp('/mas', signedInService(), seeded());
    await userEvent.click(within(await screen.findByRole('main')).getByRole('link', { name: /Idiomas/ }));
    expect(router.state.location.pathname).toBe('/idiomas');
    await userEvent.click(screen.getByRole('button', { name: 'Volver a Más' }));
    await userEvent.click(within(await screen.findByRole('main')).getByRole('button', { name: /Cerrar sesión/ }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });
});

describe('I01 · Listado de idiomas', () => {
  it('I01-1 lista todos los idiomas con su resumen', async () => {
    renderApp('/idiomas', signedInService(), seeded());
    expect(await screen.findByText('Chino mandarín')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('4 campos · 2 tags · 2 layouts · 2 flashcards')).toBeInTheDocument());
    expect(screen.getByText('Japonés')).toBeInTheDocument();
    expect(screen.getByText('4 campos · 0 tags · 0 layouts · 1 flashcard')).toBeInTheDocument();
  });

  it('I01-2 tocar un idioma abre su editor y Nuevo idioma abre el editor vacío', async () => {
    const { router } = renderApp('/idiomas', signedInService(), seeded());
    await userEvent.click(await screen.findByRole('link', { name: /Japonés/ }));
    expect(router.state.location.pathname).toBe('/idiomas/ja');
    await userEvent.click(await screen.findByRole('button', { name: 'Volver a Idiomas' }));
    await userEvent.click((await screen.findAllByRole('link', { name: /Nuevo idioma/ }))[0]);
    expect(router.state.location.pathname).toBe('/idiomas/nuevo');
    expect(await screen.findByLabelText(/Nombre del idioma/)).toHaveValue('');
  });

  it('I01-3 sin idiomas muestra el estado vacío con acción para crear', async () => {
    renderApp('/idiomas', signedInService(), new MemoryRepositories());
    expect(await screen.findByText('Todavía no configuraste ningún idioma')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Nuevo idioma/ }).length).toBeGreaterThan(0);
  });

  it('muestra el estado de error con Reintentar', async () => {
    const repos = seeded();
    repos.languagesError = new Error('sin permisos');
    renderApp('/idiomas', signedInService(), repos);
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar los idiomas');
    repos.languagesError = null;
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Chino mandarín')).toBeInTheDocument();
  });
});
