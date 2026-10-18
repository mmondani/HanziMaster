import raw from '@/test/stroke-data.json';
import { createCdnCharDataLoader, parseCharData, parseKanaFile, prefetchChars, STROKE_DATA_URLS } from './char-data';

const zh = { code: 'zh-CN' };
const ja = { code: 'ja-JP' };
const KANA_FILE = Object.values(raw.kana).join('\n');

const response = (status: number, body: unknown) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });

function fakeFetch(routes: Record<string, () => Response>) {
  const calls: string[] = [];
  const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    return routes[url]?.() ?? response(404, 'Not found');
  });
  return { fetchFn: fetchFn as unknown as typeof fetch, calls };
}

describe('parseCharData', () => {
  it('pasa las medians al sistema de la celda (Y hacia abajo)', () => {
    const data = parseCharData(raw.zh['口'])!;
    expect(data.strokes).toHaveLength(3);
    expect(data.medians[0][0]).toEqual({ x: 229, y: 900 - 584 });
  });

  it('rechaza formatos inesperados', () => {
    expect(parseCharData(null)).toBeNull();
    expect(parseCharData({ strokes: ['M 0 0'], medians: [] })).toBeNull();
    expect(parseCharData({ strokes: [1], medians: [[[0, 0]]] })).toBeNull();
  });

  it('el archivo de kana de animCJK se lee línea por línea', () => {
    const table = parseKanaFile(`${KANA_FILE}\nlínea rota\n`);
    expect([...table.keys()].sort()).toEqual(['ア', 'い', 'ー'].sort());
  });
});

describe('createCdnCharDataLoader', () => {
  it('chino: un JSON por carácter de hanzi-writer-data, con versión fija', async () => {
    const url = `${STROKE_DATA_URLS.zh}${encodeURIComponent('口')}.json`;
    const { fetchFn, calls } = fakeFetch({ [url]: () => response(200, raw.zh['口']) });
    const data = await createCdnCharDataLoader(fetchFn).load('口', zh);
    expect(data?.strokes).toHaveLength(3);
    expect(calls).toEqual([url]);
    expect(url).toContain('hanzi-writer-data@2.0.1/');
  });

  it('kanji japonés: hanzi-writer-data-jp; kana: el archivo de animCJK, descargado una sola vez', async () => {
    const kanji = `${STROKE_DATA_URLS.jaKanji}${encodeURIComponent('見')}.json`;
    const { fetchFn, calls } = fakeFetch({
      [kanji]: () => response(200, raw.ja['見']),
      [STROKE_DATA_URLS.jaKana]: () => response(200, KANA_FILE),
    });
    const loader = createCdnCharDataLoader(fetchFn);
    expect((await loader.load('見', ja))?.strokes).toHaveLength(7);
    expect((await loader.load('い', ja))?.strokes).toHaveLength(2);
    expect((await loader.load('ア', ja))?.strokes).toHaveLength(2);
    expect(await loader.load('ぬ', ja)).toBeNull();
    expect(calls).toEqual([kanji, STROKE_DATA_URLS.jaKana]);
  });

  it('un carácter sin datos (404) da null y no se vuelve a pedir', async () => {
    const { fetchFn, calls } = fakeFetch({});
    const loader = createCdnCharDataLoader(fetchFn);
    expect(await loader.load('々', zh)).toBeNull();
    expect(await loader.load('々', zh)).toBeNull();
    expect(calls).toHaveLength(1);
  });

  it('lo ya descargado no se vuelve a pedir', async () => {
    const url = `${STROKE_DATA_URLS.zh}${encodeURIComponent('口')}.json`;
    const { fetchFn, calls } = fakeFetch({ [url]: () => response(200, raw.zh['口']) });
    const loader = createCdnCharDataLoader(fetchFn);
    await Promise.all([loader.load('口', zh), loader.load('口', zh)]);
    await loader.load('口', zh);
    expect(calls).toHaveLength(1);
  });

  it('un error de red falla y se reintenta en el próximo pedido', async () => {
    let attempts = 0;
    const fetchFn = vi.fn(async () => {
      attempts++;
      if (attempts === 1) throw new TypeError('Failed to fetch');
      return response(200, raw.zh['口']);
    }) as unknown as typeof fetch;
    const loader = createCdnCharDataLoader(fetchFn);
    await expect(loader.load('口', zh)).rejects.toThrow();
    expect((await loader.load('口', zh))?.strokes).toHaveLength(3);
    expect(attempts).toBe(2);
  });

  it('un error del servidor (no 404) falla', async () => {
    const url = `${STROKE_DATA_URLS.zh}${encodeURIComponent('口')}.json`;
    const { fetchFn } = fakeFetch({ [url]: () => response(503, 'x') });
    await expect(createCdnCharDataLoader(fetchFn).load('口', zh)).rejects.toThrow(/HTTP 503/);
  });
});

describe('prefetchChars', () => {
  it('pide cada carácter una vez e ignora los errores', async () => {
    const asked: string[] = [];
    const loader = {
      load: vi.fn(async (ch: string) => {
        asked.push(ch);
        if (ch === '好') throw new Error('red');
        return null;
      }),
    };
    await prefetchChars(loader, ['你', '好', '你', '学'], zh, 2);
    expect(asked.sort()).toEqual(['好', '你', '学'].sort());
  });
});
