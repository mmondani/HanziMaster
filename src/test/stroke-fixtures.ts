import { parseCharData, parseKanaFile, type CharData, type CharDataLoader } from '@/lib/handwriting/char-data';
import raw from './stroke-data.json';

/** Datos reales de trazos de unos pocos caracteres (descargados de los mismos orígenes que usa la app). */
const kana = parseKanaFile(Object.values(raw.kana).join('\n'));

export function strokeData(char: string): CharData {
  const source = (raw.zh as Record<string, unknown>)[char] ?? (raw.ja as Record<string, unknown>)[char];
  const data = source ? parseCharData(source) : kana.get(char);
  if (!data) throw new Error(`Sin fixture de trazos para ${char}`);
  return data;
}

/** Loader de prueba: devuelve los fixtures; los caracteres sin fixture no tienen datos. */
export function fixtureLoader(): CharDataLoader & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    load: (char) => {
      calls.push(char);
      try {
        return Promise.resolve(strokeData(char));
      } catch {
        return Promise.resolve(null);
      }
    },
  };
}
