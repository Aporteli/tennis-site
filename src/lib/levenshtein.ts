/**
 * Standard Levenshtein edit distance.
 * Returns the minimum number of single-character edits (insert/delete/substitute)
 * needed to turn `a` into `b`.
 */
export function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
  
    const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
    const curr = new Array(b.length + 1).fill(0);
  
    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          curr[j - 1] + 1,
          prev[j] + 1,
          prev[j - 1] + cost,
        );
      }
      for (let k = 0; k <= b.length; k++) prev[k] = curr[k];
    }
    return prev[b.length];
  }