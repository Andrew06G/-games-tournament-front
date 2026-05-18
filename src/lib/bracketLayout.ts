/** Altura visual de cada tarjeta + separación (px). */
export const BRACKET_ROW_UNIT = 148;

/**
 * Posiciones verticales estilo árbol (FIFA): la final queda centrada
 * respecto a las semifinales, etc.
 */
export function computeBracketTops(
  matchCountsPerColumn: number[],
): number[][] {
  const rounds = matchCountsPerColumn.length;
  if (rounds === 0) return [];

  const tops: number[][] = [];

  function topFor(round: number, index: number): number {
    if (round === 0) {
      const factor = 2 ** (rounds - 1);
      return index * BRACKET_ROW_UNIT * factor;
    }
    const a = topFor(round - 1, index * 2);
    const b = topFor(round - 1, index * 2 + 1);
    return (a + b) / 2;
  }

  for (let r = 0; r < rounds; r++) {
    const n = matchCountsPerColumn[r] ?? 0;
    const col: number[] = [];
    for (let i = 0; i < n; i++) {
      col.push(topFor(r, i));
    }
    tops.push(col);
  }

  return tops;
}

export function bracketCanvasHeight(matchCountsPerColumn: number[]): number {
  const tops = computeBracketTops(matchCountsPerColumn);
  if (tops.length === 0) return 400;
  const first = tops[0];
  if (!first?.length) return 400;
  const lastTop = first[first.length - 1] ?? 0;
  return lastTop + BRACKET_ROW_UNIT + 48;
}
