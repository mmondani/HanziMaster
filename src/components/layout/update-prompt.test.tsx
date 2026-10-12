import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { pwaState } from '@/test/pwa-register-stub';
import { UpdatePrompt } from './update-prompt';

afterEach(() => {
  pwaState.needRefresh = false;
  pwaState.updateServiceWorker.mockClear();
});

describe('UpdatePrompt', () => {
  it('no muestra nada si no hay una versión nueva', () => {
    render(<UpdatePrompt />);
    expect(screen.queryByText(/versión nueva/)).toBeNull();
  });

  it('avisa cuando hay una versión nueva y deja actualizar a pedido del usuario', async () => {
    pwaState.needRefresh = true;
    render(<UpdatePrompt />);
    expect(screen.getByRole('status')).toHaveTextContent('Hay una versión nueva de Hanzi Master.');
    expect(pwaState.updateServiceWorker).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    expect(pwaState.updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('"Más tarde" cierra el aviso sin actualizar', async () => {
    pwaState.needRefresh = true;
    render(<UpdatePrompt />);
    await userEvent.click(screen.getByRole('button', { name: 'Más tarde' }));
    expect(pwaState.updateServiceWorker).not.toHaveBeenCalled();
  });
});
