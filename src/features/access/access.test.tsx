import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FakeAuthService } from '@/test/fake-auth-service';
import { renderApp, signedInService } from '@/test/render-app';

const googleButton = () => screen.findByRole('button', { name: /Ingresar con Google|Conectando/ });

describe('A01 · Ingreso con Google', () => {
  it('A01-1 sin sesión, una ruta privada lleva a /login', async () => {
    const { router } = renderApp('/mazos');
    expect(await googleButton()).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('A01-2 presionar el botón inicia el ingreso y muestra "Conectando"', async () => {
    const service = new FakeAuthService();
    let release!: () => void;
    service.signInGate = new Promise((r) => { release = r; });
    renderApp('/login', service);
    await userEvent.click(await googleButton());
    const busy = await screen.findByRole('button', { name: 'Conectando con Google…' });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');
    expect(service.signInCalls).toBe(1);
    await act(async () => { release(); });
  });

  it('A01-3 un email habilitado accede a /flashcards', async () => {
    const service = new FakeAuthService();
    service.allowed.add('ana@gmail.com');
    const { router } = renderApp('/login', service);
    await userEvent.click(await googleButton());
    await waitFor(() => expect(router.state.location.pathname).toBe('/flashcards'));
    expect(await screen.findByRole('heading', { name: 'Flashcards', level: 1 })).toBeInTheDocument();
  });

  it('A01-3 tras ingresar vuelve a la ruta privada que se intentó abrir', async () => {
    const service = new FakeAuthService();
    service.allowed.add('ana@gmail.com');
    const { router } = renderApp('/mazos', service);
    await userEvent.click(await googleButton());
    await waitFor(() => expect(router.state.location.pathname).toBe('/mazos'));
  });

  it('A01-4 un email no habilitado termina sin sesión y en A02', async () => {
    const service = new FakeAuthService();
    const { router } = renderApp('/login', service);
    await userEvent.click(await googleButton());
    await waitFor(() => expect(router.state.location.pathname).toBe('/acceso-denegado'));
    expect(service.user).toBeNull();
  });

  it('A01-5 un fallo muestra el error y permite reintentar', async () => {
    const service = new FakeAuthService();
    service.failSignIn = true;
    renderApp('/login', service);
    await userEvent.click(await googleButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo completar el ingreso');
    const button = screen.getByRole('button', { name: 'Ingresar con Google' });
    expect(button).toBeEnabled();
    service.failSignIn = false;
    service.allowed.add('ana@gmail.com');
    await userEvent.click(button);
    await screen.findByRole('heading', { name: 'Flashcards', level: 1 });
  });

  it('A01-6 el botón es operable con teclado', async () => {
    const service = new FakeAuthService();
    service.allowed.add('ana@gmail.com');
    renderApp('/login', service);
    const button = await googleButton();
    button.focus();
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('heading', { name: 'Flashcards', level: 1 });
  });

  it('con sesión activa, /login redirige a /flashcards', async () => {
    const { router } = renderApp('/login', signedInService());
    await waitFor(() => expect(router.state.location.pathname).toBe('/flashcards'));
  });
});

describe('A02 · Acceso denegado', () => {
  async function denied() {
    const service = new FakeAuthService();
    const view = renderApp('/login', service);
    await userEvent.click(await googleButton());
    await screen.findByRole('heading', { name: 'Esta cuenta no tiene acceso' });
    return view;
  }

  it('A02-1 muestra el email con el que se intentó ingresar', async () => {
    await denied();
    expect(screen.getByText('ana@gmail.com')).toBeInTheDocument();
  });

  it('A02-2 no hay sesión activa mientras se ve la pantalla', async () => {
    const { service } = await denied();
    expect(service.user).toBeNull();
  });

  it('A02-3 "Probar con otra cuenta" vuelve a A01 y permite elegir otra cuenta', async () => {
    const { router, service } = await denied();
    service.nextAccount = { uid: 'u2', email: 'luis@gmail.com' };
    service.allowed.add('luis@gmail.com');
    await userEvent.click(screen.getByRole('link', { name: 'Probar con otra cuenta' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    await userEvent.click(await googleButton());
    await waitFor(() => expect(router.state.location.pathname).toBe('/flashcards'));
  });

  it('A02-4 abrir /acceso-denegado sin haber intentado ingresar redirige a /login', async () => {
    const { router } = renderApp('/acceso-denegado');
    await googleButton();
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });
});

describe('A03 · Sin conexión (pantalla completa)', () => {
  function unreachableService() {
    const service = signedInService();
    service.unreachable = true;
    return service;
  }

  it('A03-1 sin red y sin poder validar la sesión se muestra A03 con Reintentar', async () => {
    renderApp('/flashcards', unreachableService());
    expect(await screen.findByRole('heading', { name: 'Sin conexión' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reintentar/ })).toBeInTheDocument();
  });

  it('A03-2 Reintentar continúa la carga cuando vuelve la conexión', async () => {
    const service = unreachableService();
    renderApp('/flashcards', service);
    await screen.findByRole('heading', { name: 'Sin conexión' });
    service.unreachable = false;
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(await screen.findByRole('heading', { name: 'Flashcards', level: 1 })).toBeInTheDocument();
  });

  it('A03-2 al volver la red (evento online) reanuda sola', async () => {
    const service = unreachableService();
    renderApp('/flashcards', service);
    await screen.findByRole('heading', { name: 'Sin conexión' });
    service.unreachable = false;
    act(() => { window.dispatchEvent(new Event('online')); });
    expect(await screen.findByRole('heading', { name: 'Flashcards', level: 1 })).toBeInTheDocument();
  });

  it('A03-3 se anuncia como pantalla principal y el botón se opera con teclado', async () => {
    const service = unreachableService();
    renderApp('/flashcards', service);
    await screen.findByRole('heading', { name: 'Sin conexión' });
    expect(screen.getByRole('main')).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: /Reintentar/ });
    retry.focus();
    expect(retry).toHaveFocus();
  });
});

describe('A04 · Aviso de sin conexión', () => {
  afterEach(() => vi.restoreAllMocks());

  it('A04-1 aparece al perder la conexión sin bloquear la pantalla y desaparece al recuperarla', async () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    renderApp('/flashcards', signedInService());
    await screen.findByRole('heading', { name: 'Flashcards', level: 1 });
    expect(screen.queryByText(/Sin conexión\./)).toBeNull();

    onLine.mockReturnValue(false);
    act(() => { window.dispatchEvent(new Event('offline')); });
    expect(await screen.findByText(/Puedes seguir estudiando/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Flashcards', level: 1 })).toBeInTheDocument();

    onLine.mockReturnValue(true);
    act(() => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(screen.queryByText(/Puedes seguir estudiando/)).toBeNull());
  });
});
