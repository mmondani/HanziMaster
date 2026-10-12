import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

export interface DeleteFlashcardDialogProps {
  /** Cantidad de mazos que incluyen la flashcard. */
  deckCount: number;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteFlashcardDialog({ deckCount, busy, onConfirm, onClose }: DeleteFlashcardDialogProps) {
  return (
    <Dialog
      open
      role="alertdialog"
      title="¿Eliminar esta flashcard?"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" data-autofocus onClick={onClose}>Cancelar</Button>
          <Button variant="danger" loading={busy} onClick={onConfirm}>Eliminar</Button>
        </>
      }
    >
      <p className="muted">
        {deckCount > 0
          ? `Se quitará también de ${deckCount === 1 ? 'el mazo que la incluye' : `los ${deckCount} mazos que la incluyen`}.`
          : 'No está en ningún mazo.'}{' '}
        Podrás deshacerlo unos segundos después de eliminarla.
      </p>
    </Dialog>
  );
}
