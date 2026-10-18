import { createContext, useContext, type ReactNode } from 'react';
import { createCdnCharDataLoader, type CharDataLoader } from './char-data';

const CharDataContext = createContext<CharDataLoader>(createCdnCharDataLoader());

/** Origen de los datos de trazos. Por defecto, jsDelivr; los tests inyectan uno simulado. */
export function useCharDataLoader(): CharDataLoader {
  return useContext(CharDataContext);
}

export function CharDataProvider({ loader, children }: { loader: CharDataLoader; children: ReactNode }) {
  return <CharDataContext.Provider value={loader}>{children}</CharDataContext.Provider>;
}
