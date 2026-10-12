import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-provider';
import type { Repositories } from './types';

const RepositoriesContext = createContext<Repositories | null>(null);

/** Repositorios de datos del usuario autenticado. Solo se usa bajo rutas privadas. */
export function useRepositories(): Repositories {
  const repos = useContext(RepositoriesContext);
  if (!repos) throw new Error('useRepositories requiere una sesión activa y <RepositoriesProvider>');
  return repos;
}

export function RepositoriesProvider({ factory, children }: { factory: (uid: string) => Repositories; children: ReactNode }) {
  const { state } = useAuth();
  const uid = state.status === 'allowed' ? state.user.uid : null;
  const repos = useMemo(() => (uid ? factory(uid) : null), [uid, factory]);
  return <RepositoriesContext.Provider value={repos}>{children}</RepositoriesContext.Provider>;
}
