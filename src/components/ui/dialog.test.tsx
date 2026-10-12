import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from './dialog';

function Harness({ dismissible = true }: { dismissible?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>
      <Dialog
        open={open}
        title="Confirmar"
        dismissible={dismissible}
        onClose={() => setOpen(false)}
        footer={<><button onClick={() => setOpen(false)}>Cancelar</button><button data-autofocus>Aceptar</button></>}
      >
        Contenido
      </Dialog>
    </>
  );
}

describe('Dialog', () => {
  it('se muestra con rol de diálogo modal y título accesible', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByText('Abrir'));
    const dlg = screen.getByRole('dialog', { name: 'Confirmar' });
    expect(dlg).toHaveAttribute('aria-modal', 'true');
  });

  it('el foco inicial va al elemento con data-autofocus', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByText('Abrir'));
    expect(screen.getByText('Aceptar')).toHaveFocus();
  });

  it('Esc lo cierra y devuelve el foco al disparador', async () => {
    render(<Harness />);
    const trigger = screen.getByText('Abrir');
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('Tab no saca el foco del diálogo', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByText('Abrir'));
    const dlg = screen.getByRole('dialog');
    for (let i = 0; i < 6; i++) {
      await userEvent.tab();
      expect(dlg).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it('con dismissible=false no se cierra con Esc ni muestra ✕', async () => {
    render(<Harness dismissible={false} />);
    await userEvent.click(screen.getByText('Abrir'));
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cerrar' })).toBeNull();
  });
});
