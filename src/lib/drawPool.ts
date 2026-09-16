import type { Mode, Player } from './types';
import { checkIsBye } from './tournament/helpers';

/** One bracket entry per person (singles) or per pair (doubles). */
export function uniqueDrawEntries(players: Player[], mode: Mode): Player[] {
  const seenId = new Set<string>();
  const unique = players.filter((p) => {
    if (!p?.name || checkIsBye(p.name) || p.bye) return false;
    const key = p.id ?? p.name;
    if (seenId.has(key)) return false;
    seenId.add(key);
    return true;
  });

  if (mode !== 'doubles') return unique;

  const seenPair = new Set<string>();
  return unique.filter((p) => {
    const partnerId = p.partner?.id ?? `${p.partner?.firstName ?? ''}:${p.partner?.lastName ?? ''}`;
    const key = partnerId
      ? [p.id ?? p.name, partnerId].sort().join('::')
      : p.id ?? p.name;
    if (seenPair.has(key)) return false;
    seenPair.add(key);
    return true;
  });
}
