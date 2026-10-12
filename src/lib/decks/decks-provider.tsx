import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRepositories } from '@/lib/repositories/repositories-provider';
import type { Deck } from '@/lib/types';

export interface DecksContextValue {
  /** Todos los mazos del usuario; `null` mientras carga. */
  decks: Deck[] | null;
  error: Error | null;
  retry: () => void;
}

const DecksContext = createContext<DecksContextValue | null>(null);

export function useDecks(): DecksContextValue {
  const ctx = useContext(DecksContext);
  if (!ctx) throw new Error('useDecks debe usarse dentro de <DecksProvider>');
  return ctx;
}

export function DecksProvider({ children }: { children: ReactNode }) {
  const { decks: repo } = useRepositories();
  const [decks, setDecks] = useState<Deck[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    return repo.subscribe(
      (list) => { setDecks(list); setError(null); },
      (e) => setError(e),
    );
  }, [repo, attempt]);

  const retry = useCallback(() => { setError(null); setAttempt((n) => n + 1); }, []);
  const value = useMemo(() => ({ decks, error, retry }), [decks, error, retry]);
  return <DecksContext.Provider value={value}>{children}</DecksContext.Provider>;
}
