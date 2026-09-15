import type { Player } from '../types';

export function checkIsBye(name: string | null | undefined): boolean {
  if (!name) return false;
  return name.trim().toLowerCase() === 'bye';
}

export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export function roundLabel(playersRemaining: number): string {
  if (playersRemaining === 2) return 'Final';
  if (playersRemaining === 4) return 'Semifinal';
  if (playersRemaining === 8) return 'Quarterfinal';
  return `Round of ${playersRemaining}`;
}

export function parsePlayersInput(input: string): Player[] {
  return input
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((line) => {
      let rawName = line;
      let seedVal: number | null = null;

      const match = line.match(/^(\d+)\.\s*(.+)/);
      if (match) {
        seedVal = parseInt(match[1], 10);
        rawName = match[2].trim();
      }

      const byeSuffix = /\s+-?\s*bye$/i;
      if (byeSuffix.test(rawName) && rawName.toLowerCase().trim() !== 'bye') {
        rawName = rawName.replace(byeSuffix, '').trim();
      }

      return {
        name: rawName,
        seed: seedVal,
        bye: checkIsBye(rawName),
      };
    });
}

/** True if a name already looks like a composed pair ("A/B", "A / B", "A/B/C"). */
function looksLikePair(name: string): boolean {
  return name.includes('/');
}

/**
 * Canonical display name for a bracket / score / modal slot.
 * - null / bye         → 'TBD' / 'Bye'
 * - no partner         → player.name as-is
 * - partner present    → "PrimaryFirst/PartnerFirst" (unless name already looks like "A/B")
 *
 * Note: we deliberately ignore `player.mode` here — presence of `partner` is
 * the strongest signal that this is a doubles entry.
 */
export function getPlayerDisplayName(player: Player | null | undefined): string {
  if (!player) return 'TBD';
  if (checkIsBye(player.name)) return player.name;

  const partner = player.partner;
  if (!partner) return player.name;

  // Backend already stored a composed string — leave it alone.
  if (looksLikePair(player.name)) return player.name;

  const primaryFirst = player.name.trim().split(/\s+/)[0] || player.name;
  const partnerFirst = (partner.firstName ?? '').trim();
  const partnerFull = [partner.firstName, partner.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  const right = partnerFirst || partnerFull;
  return right ? `${primaryFirst}/${right}` : player.name;
}