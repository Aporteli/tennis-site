import { checkIsBye } from './helpers';
import type { BracketData, MatchDetails } from '../types';

/** Walk over first-round Bye slots so the real player advances. */
export function advanceFirstRoundByes(
  bd: BracketData,
  md: MatchDetails,
  size: number,
): void {
  for (let i = 0; i < size; i += 2) {
    const p1 = bd[0][i] ?? null;
    const p2 = bd[0][i + 1] ?? null;
    if (!bd[1]) bd[1] = new Array(size / 2).fill(null);
    if (!md[0]) md[0] = new Array(size / 2).fill(null);
    if (!p1 || !p2) continue;

    const p1Bye = checkIsBye(p1.name);
    const p2Bye = checkIsBye(p2.name);
    if (!p1Bye && p2Bye) {
      bd[1][i / 2] = { ...p1, bye: false };
      md[0][i / 2] = { isWalkover: true, winnerIndex: 0 };
    } else if (p1Bye && !p2Bye) {
      bd[1][i / 2] = { ...p2, bye: false };
      md[0][i / 2] = { isWalkover: true, winnerIndex: 1 };
    }
  }
}
