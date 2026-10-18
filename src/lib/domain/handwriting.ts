import type { Language } from '@/lib/types';

/** Id reservado del layout virtual "Dibujar". No se guarda en `Language.layouts`: lo agrega el sistema en chino y japonés. */
export const DRAW_LAYOUT_ID = '__draw__';
export const DRAW_LAYOUT_NAME = 'Dibujar';

/** ¿El idioma ofrece el layout Dibujar? Solo chino (`zh-*`) y japonés (`ja-*`). */
export function supportsHandwriting(language: Pick<Language, 'code'>): boolean {
  return ['zh', 'ja'].includes(language.code.split('-')[0].toLowerCase());
}

export interface LayoutOption {
  id: string;
  name: string;
}

/** Layouts que se pueden elegir en un modo de recorrida: los del idioma y, en chino o japonés, Dibujar al final. */
export function layoutOptions(language: Language): LayoutOption[] {
  const own = language.layouts.map((l) => ({ id: l.id, name: l.name }));
  return supportsHandwriting(language) ? [...own, { id: DRAW_LAYOUT_ID, name: DRAW_LAYOUT_NAME }] : own;
}

/** Hanzi/kanji (incluye 々 y 〇), hiragana, katakana y la marca de vocal larga ー. */
const DRAWABLE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]/u;

/** Caracteres de la palabra que se dibujan, uno por celda. Espacios, puntuación, letras latinas y números se ignoran. */
export function drawableChars(word: string): string[] {
  return [...word].filter((ch) => DRAWABLE.test(ch));
}

/**
 * Resultado de una celda:
 * - `ok`: todos los trazos coinciden.
 * - `error`: `missing` son los trazos del carácter que faltan; `wrong`, los trazos dibujados mal hechos o sobrantes.
 * - `unavailable`: no hay datos de trazos del carácter; no se puede validar y no cuenta como error.
 */
export type CharVerdict =
  | { kind: 'ok' }
  | { kind: 'error'; missing: number[]; wrong: number[] }
  | { kind: 'unavailable' };

export type HandwritingOutcome = 'correct' | 'errors' | 'unverifiable';

/** Resultado de la palabra: con un error alcanza para `errors`; si ninguna celda se pudo validar, `unverifiable`. */
export function handwritingOutcome(verdicts: CharVerdict[]): HandwritingOutcome {
  if (verdicts.some((v) => v.kind === 'error')) return 'errors';
  return verdicts.some((v) => v.kind === 'ok') ? 'correct' : 'unverifiable';
}

/** "Correcto", "Faltan 2 trazos", "1 trazo mal hecho o de más · falta 1 trazo"… */
export function describeVerdict(verdict: CharVerdict): string {
  if (verdict.kind === 'ok') return 'Correcto';
  if (verdict.kind === 'unavailable') return 'No se puede validar';
  const parts: string[] = [];
  const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
  if (verdict.wrong.length > 0) parts.push(n(verdict.wrong.length, 'trazo mal hecho o de más', 'trazos mal hechos o de más'));
  if (verdict.missing.length > 0) parts.push(`${verdict.missing.length === 1 ? 'falta' : 'faltan'} ${n(verdict.missing.length, 'trazo', 'trazos')}`);
  const text = parts.join(' · ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
