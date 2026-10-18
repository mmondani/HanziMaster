import type { Point } from '@/lib/domain/strokes';
import type { Language } from '@/lib/types';

/**
 * Trazos de un carácter (formato de hanzi-writer).
 * - `strokes`: contorno SVG de cada trazo, en el sistema original (1024 de lado, eje Y hacia arriba con base en 900).
 * - `medians`: línea central de cada trazo, ya convertida a unidades de celda con el eje Y hacia abajo.
 */
export interface CharData {
  strokes: string[];
  medians: Point[][];
}

export interface CharDataLoader {
  /** Datos del carácter en el idioma, o `null` si no existen. Falla si no se pudieron descargar (p. ej. sin conexión). */
  load(char: string, language: Pick<Language, 'code'>): Promise<CharData | null>;
}

/**
 * Datos con versión fija en jsDelivr (no cambian: el service worker los guarda sin vencimiento corto).
 * - Chino: Make Me a Hanzi vía hanzi-writer-data. Licencia Arphic Public License.
 * - Kanji japoneses: hanzi-writer-data-jp (la 0.0.2 se publicó sin los datos: se usa la 0.0.1). Arphic PL + LGPL.
 * - Kana: animCJK, un archivo con todos los caracteres. LGPL.
 */
export const STROKE_DATA_URLS = {
  zh: 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/',
  jaKanji: 'https://cdn.jsdelivr.net/npm/hanzi-writer-data-jp@0.0.1/',
  jaKana: 'https://cdn.jsdelivr.net/gh/parsimonhi/animCJK@3e1253b341cc7be14c3540bb3c045e6163557777/graphicsJaKana.txt',
} as const;

/** Línea de base del sistema de coordenadas de los datos: `y` en la celda = 900 − `y` original. */
const BASELINE = 900;

const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}ー]/u;

const isPair = (p: unknown): p is [number, number] => Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number';

/** Valida el JSON de un carácter y pasa las medians a unidades de celda. `null` si el formato no es el esperado. */
export function parseCharData(raw: unknown): CharData | null {
  const { strokes, medians } = (raw && typeof raw === 'object' ? raw : {}) as { strokes?: unknown; medians?: unknown };
  if (!Array.isArray(strokes) || !Array.isArray(medians) || strokes.length === 0 || strokes.length !== medians.length) return null;
  if (!strokes.every((s) => typeof s === 'string')) return null;
  if (!medians.every((m) => Array.isArray(m) && m.length > 0 && m.every(isPair))) return null;
  return {
    strokes: strokes as string[],
    medians: (medians as [number, number][][]).map((m) => m.map(([x, y]) => ({ x, y: BASELINE - y }))),
  };
}

/** Archivo de animCJK: un JSON por línea con `character`, `strokes` y `medians`. */
export function parseKanaFile(text: string): Map<string, CharData> {
  const out = new Map<string, CharData>();
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      const raw = JSON.parse(line) as { character?: unknown };
      const data = parseCharData(raw);
      if (data && typeof raw.character === 'string') out.set(raw.character, data);
    } catch {
      // Una línea dañada no invalida el resto.
    }
  }
  return out;
}

/**
 * Descarga los datos de jsDelivr. Guarda en memoria lo ya pedido (incluso los `null`) y reintenta lo que falló.
 * Entre sesiones, la caché la hace el service worker.
 */
export function createCdnCharDataLoader(fetchFn: typeof fetch = (input, init) => fetch(input, init)): CharDataLoader {
  const cache = new Map<string, Promise<CharData | null>>();
  let kana: Promise<Map<string, CharData>> | null = null;

  async function fetchJson(url: string): Promise<unknown> {
    const res = await fetchFn(url);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`No se pudieron descargar los trazos (HTTP ${res.status}).`);
    return res.json();
  }

  function kanaTable(): Promise<Map<string, CharData>> {
    if (!kana) {
      kana = fetchFn(STROKE_DATA_URLS.jaKana).then(async (res) => {
        if (!res.ok) throw new Error(`No se pudieron descargar los trazos (HTTP ${res.status}).`);
        return parseKanaFile(await res.text());
      });
      kana.catch(() => { kana = null; });
    }
    return kana;
  }

  return {
    load(char, language) {
      const ja = language.code.split('-')[0].toLowerCase() === 'ja';
      const key = `${ja ? 'ja' : 'zh'}:${char}`;
      let pending = cache.get(key);
      if (!pending) {
        pending = ja && KANA.test(char)
          ? kanaTable().then((table) => table.get(char) ?? null)
          : fetchJson(`${ja ? STROKE_DATA_URLS.jaKanji : STROKE_DATA_URLS.zh}${encodeURIComponent(char)}.json`).then((raw) => (raw === null ? null : parseCharData(raw)));
        cache.set(key, pending);
        pending.catch(() => cache.delete(key));
      }
      return pending;
    },
  };
}

/** Descarga de antemano los caracteres de varias palabras (de a pocos por vez); los errores se ignoran. */
export async function prefetchChars(loader: CharDataLoader, chars: string[], language: Pick<Language, 'code'>, concurrency = 6): Promise<void> {
  const queue = [...new Set(chars)];
  const worker = async () => {
    for (let ch = queue.shift(); ch !== undefined; ch = queue.shift()) {
      await loader.load(ch, language).catch(() => null);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
}
