import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRepositories } from '@/lib/repositories/repositories-provider';
import type { Flashcard } from '@/lib/types';

export interface FlashcardsContextValue {
  /** Todas las flashcards del usuario; `null` mientras carga. */
  flashcards: Flashcard[] | null;
  error: Error | null;
  retry: () => void;
}

const FlashcardsContext = createContext<FlashcardsContextValue | null>(null);

export function useFlashcards(): FlashcardsContextValue {
  const ctx = useContext(FlashcardsContext);
  if (!ctx) throw new Error('useFlashcards debe usarse dentro de <FlashcardsProvider>');
  return ctx;
}

export function FlashcardsProvider({ children }: { children: ReactNode }) {
  const { flashcards: repo } = useRepositories();
  const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    return repo.subscribe(
      (list) => { setFlashcards(list); setError(null); },
      (e) => setError(e),
    );
  }, [repo, attempt]);

  const retry = useCallback(() => { setError(null); setAttempt((n) => n + 1); }, []);
  const value = useMemo(() => ({ flashcards, error, retry }), [flashcards, error, retry]);
  return <FlashcardsContext.Provider value={value}>{children}</FlashcardsContext.Provider>;
}
