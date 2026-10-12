import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/toast-provider';
import { useRepositories } from '@/lib/repositories/repositories-provider';

/** Elimina una flashcard, avisa con la opción de deshacer y vuelve al listado. */
export function useDeleteFlashcard() {
  const { flashcards } = useRepositories();
  const toast = useToast();
  const navigate = useNavigate();

  return useCallback(async (cardId: string) => {
    const removed = await flashcards.remove(cardId);
    toast.show({
      message: 'Flashcard eliminada',
      duration: 8000,
      action: { label: 'Deshacer', onClick: () => void flashcards.restore(removed) },
    });
    navigate('/flashcards');
  }, [flashcards, toast, navigate]);
}
