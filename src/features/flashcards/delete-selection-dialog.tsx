import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

export interface DeleteSelectionDialogProps {
  count: number;
  busy?: boolean;
  /** Hubo un error al eliminar. */
  failed?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** F02 · Confirmación del borrado de las flashcards seleccionadas. */
export function DeleteSelectionDialog({ count, busy, failed, onConfirm, onClose }: DeleteSelectionDialogProps) {
  const noun = count === 1 ? 'flashcard' : 'flashcards';
  return (
    <Dialog
      open
      role="alertdialog"
      title={`¿Eliminar ${count} ${noun}?`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" data-autofocus onClick={onClose}>Cancelar</Button>
          <Button variant="danger" loading={busy} onClick={onConfirm}>Eliminar {count} {noun}</Button>
        </>
      }
    >
      <p className="muted">
        Se {count === 1 ? 'quitará' : 'quitarán'} también de los mazos que {count === 1 ? 'la incluyan' : 'las incluyan'}. Esta acción no se puede deshacer.
      </p>
      {failed && <p className="error" role="alert" style={{ marginTop: 'var(--sp-2)' }}>No se pudo eliminar. Inténtalo de nuevo.</p>}
    </Dialog>
  );
}
