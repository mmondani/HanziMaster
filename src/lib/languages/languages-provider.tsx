import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import { useRepositories } from '@/lib/repositories/repositories-provider';
import type { LanguageUsage } from '@/lib/repositories/types';
import type { Language } from '@/lib/types';

export interface LanguagesContextValue {
  /** `null` mientras carga. */
  languages: Language[] | null;
  error: Error | null;
  usage: Record<string, LanguageUsage>;
  /** Idioma sobre el que se trabaja en Flashcards y Mazos (global y recordado entre sesiones). */
  active: Language | null;
  setActiveId: (id: string) => void;
  retry: () => void;
}

const LanguagesContext = createContext<LanguagesContextValue | null>(null);

export function useLanguages(): LanguagesContextValue {
  const ctx = useContext(LanguagesContext);
  if (!ctx) throw new Error('useLanguages debe usarse dentro de <LanguagesProvider>');
  return ctx;
}

const storageKey = (uid: string) => `hm:active-language:${uid}`;

function readStored(uid: string): string | null {
  try { return localStorage.getItem(storageKey(uid)); } catch { return null; }
}

export function LanguagesProvider({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const uid = state.status === 'allowed' ? state.user.uid : '';
  const { languages: repo } = useRepositories();
  const [languages, setLanguages] = useState<Language[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [usage, setUsage] = useState<Record<string, LanguageUsage>>({});
  const [activeId, setActiveIdState] = useState<string | null>(() => readStored(uid));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    return repo.subscribe(
      (list) => { setLanguages(list); setError(null); },
      (e) => setError(e),
    );
  }, [repo, attempt]);

  useEffect(() => repo.subscribeUsage(setUsage), [repo]);

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
    try { localStorage.setItem(storageKey(uid), id); } catch { /* sin almacenamiento: no se recuerda */ }
  }, [uid]);

  const retry = useCallback(() => { setError(null); setAttempt((n) => n + 1); }, []);

  const active = useMemo(
    () => languages?.find((l) => l.id === activeId) ?? languages?.[0] ?? null,
    [languages, activeId],
  );

  const value = useMemo(
    () => ({ languages, error, usage, active, setActiveId, retry }),
    [languages, error, usage, active, setActiveId, retry],
  );
  return <LanguagesContext.Provider value={value}>{children}</LanguagesContext.Provider>;
}
