import { createContext, useContext, type ReactNode } from 'react';
import type { AiCompleter } from '@/lib/domain/ai-completion';

const AiContext = createContext<AiCompleter | null>(null);

/** Servicio de IA disponible, o `null` si la app no lo ofrece (el botón "Completar con IA" no se muestra). */
export function useAi(): AiCompleter | null {
  return useContext(AiContext);
}

export function AiProvider({ completer, children }: { completer: AiCompleter; children: ReactNode }) {
  return <AiContext.Provider value={completer}>{children}</AiContext.Provider>;
}
