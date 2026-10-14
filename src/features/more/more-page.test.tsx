import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRepositories } from '@/lib/repositories/memory-repositories';
import { chinese } from '@/test/fixtures';
import { renderApp, signedInService } from '@/test/render-app';

function mockMobile() {
  window.matchMedia = (() => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
}

describe('MJ3 · Más: selector de tema', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    mockMobile();
  });

  it('MJ3-5 permite elegir oscuro, claro o sistema y lo aplica y recuerda', async () => {
    const repos = new MemoryRepositories();
    repos.languagesData = [chinese()];
    renderApp('/mas', signedInService(), repos);
    // El sidebar (solo desktop por CSS) también tiene un selector: se prueba el de la pantalla.
    const page = within(await screen.findByRole('main'));
    const button = (name: string) => page.getByRole('button', { name });
    expect(page.getByRole('group', { name: 'Tema' })).toBeInTheDocument();
    expect(button('Sistema')).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(button('Oscuro'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('hm:theme')).toBe('dark');
    expect(button('Oscuro')).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(button('Claro'));
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
