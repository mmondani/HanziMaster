/** Mezcla Fisher-Yates: devuelve una permutación uniforme sin modificar el original. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const sameOrder = <T>(a: readonly T[], b: readonly T[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Nueva mezcla que no repite el orden anterior (cuando es posible: con 0 o 1 elementos no hay otro orden).
 * Si el azar repite el orden, se rota una posición para garantizar la diferencia.
 */
export function reshuffle<T>(items: readonly T[], previous: readonly T[], random: () => number = Math.random): T[] {
  const next = shuffle(items, random);
  if (items.length < 2 || !sameOrder(next, previous)) return next;
  return [...next.slice(1), next[0]];
}
