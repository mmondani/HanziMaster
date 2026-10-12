import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './toast-provider';

function Trigger({ onUndo }: { onUndo: () => void }) {
  const toast = useToast();
  return <button onClick={() => toast.show({ message: 'Guardado', action: { label: 'Deshacer', onClick: onUndo } })}>Mostrar</button>;
}

describe('Toast', () => {
  it('muestra el mensaje en una región de estado y ejecuta la acción', async () => {
    const onUndo = vi.fn();
    render(<ToastProvider><Trigger onUndo={onUndo} /></ToastProvider>);
    await userEvent.click(screen.getByText('Mostrar'));
    expect(screen.getByText('Guardado')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    expect(onUndo).toHaveBeenCalledOnce();
    expect(screen.queryByText('Guardado')).toBeNull();
  });

  it('se oculta solo pasado el tiempo', () => {
    vi.useFakeTimers();
    render(<ToastProvider><Trigger onUndo={() => {}} /></ToastProvider>);
    act(() => { screen.getByText('Mostrar').click(); });
    expect(screen.getByText('Guardado')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(5100); });
    expect(screen.queryByText('Guardado')).toBeNull();
    vi.useRealTimers();
  });
});
