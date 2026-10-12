import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { Button } from './button';
import { Dialog } from './dialog';

/**
 * Pide confirmación al salir de una pantalla con cambios sin guardar (navegación interna y cierre de pestaña).
 * `when` es una función para poder desactivarla justo antes de navegar tras guardar.
 */
export function UnsavedChangesGuard({ when }: { when: () => boolean }) {
  const blocker = useBlocker(() => when());

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (when()) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [when]);

  return (
    <Dialog
      open={blocker.state === 'blocked'}
      title="¿Salir sin guardar?"
      role="alertdialog"
      onClose={() => blocker.reset?.()}
      footer={
        <>
          <Button variant="secondary" data-autofocus onClick={() => blocker.reset?.()}>Seguir editando</Button>
          <Button variant="danger" onClick={() => blocker.proceed?.()}>Salir sin guardar</Button>
        </>
      }
    >
      <p className="muted">Tienes cambios que no se guardaron. Si sales ahora, se pierden.</p>
    </Dialog>
  );
}
