import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp, signedInService } from '@/test/render-app';

async function renderAt(path: string) {
  const { router } = renderApp(path, signedInService());
  await waitFor(() => expect(document.getElementById('main') ?? document.querySelector('.push')).toBeTruthy());
  return router;
}

describe('AppShell', () => {
  it('redirige / a /flashcards', async () => {
    const router = await renderAt('/');
    expect(router.state.location.pathname).toBe('/flashcards');
  });

  it('la barra inferior tiene 3 ítems: Flashcards, Mazos y Más', async () => {
    await renderAt('/flashcards');
    const navs = screen.getAllByRole('navigation', { name: 'Principal', hidden: true });
    const bottom = navs.find((n) => n.classList.contains('bottom-nav'))!;
    const labels = within(bottom).getAllByRole('link', { hidden: true }).map((a) => a.textContent);
    expect(labels).toEqual(['Flashcards', 'Mazos', 'Más']);
  });

  it('marca el ítem activo con aria-current="page"', async () => {
    await renderAt('/mazos');
    const bottom = document.querySelector('.bottom-nav') as HTMLElement;
    const current = within(bottom).getAllByRole('link', { hidden: true }).filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current.map((a) => a.textContent)).toEqual(['Mazos']);
  });

  it('"Más" figura activo en G01 (G01-3)', async () => {
    await renderAt('/mas');
    const bottom = document.querySelector('.bottom-nav') as HTMLElement;
    const mas = within(bottom).getByRole('link', { name: 'Más', hidden: true });
    expect(mas).toHaveAttribute('aria-current', 'page');
  });

  it('en el sidebar Idiomas es un ítem secundario bajo "Configuración"', async () => {
    await renderAt('/idiomas');
    const side = document.querySelector('.sidebar') as HTMLElement;
    expect(within(side).getByText('Configuración')).toBeInTheDocument();
    expect(within(side).getByRole('link', { name: 'Idiomas', hidden: true })).toHaveAttribute('aria-current', 'page');
  });

  it('las pantallas hijas ocultan la barra inferior y muestran Volver', async () => {
    await renderAt('/idiomas/nuevo');
    expect(document.querySelector('.bottom-nav')).toBeNull();
    expect(screen.getByRole('button', { name: 'Volver a Idiomas' })).toBeInTheDocument();
  });

  it('al cambiar de ruta el foco va a <main>', async () => {
    const router = await renderAt('/flashcards');
    await router.navigate('/mazos');
    expect(await screen.findByRole('heading', { name: 'Mazos', level: 1 })).toBeInTheDocument();
    await waitFor(() => expect(document.getElementById('main')).toHaveFocus());
  });

  it('Volver regresa a la pantalla anterior', async () => {
    const router = await renderAt('/idiomas');
    await router.navigate('/idiomas/nuevo');
    await userEvent.click(await screen.findByRole('button', { name: 'Volver a Idiomas' }));
    expect(router.state.location.pathname).toBe('/idiomas');
  });
});
