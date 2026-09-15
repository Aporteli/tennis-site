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
 * "გიორგი ლატარია"     → "გ.ლატარია"
 * "გიორგი კ. ლატარია"  → "გ.ლატარია"
 * "გ.ლატარია"          → "გ.ლატარია"  (already short — unchanged)
 * "ლატარია"            → "ლატარია"    (single token — unchanged)
 */
export function shortName(fullName: string): string {
  const trimmed = fullName.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  const parts = trimmed.split(' ');
  if (parts.length === 1) return parts[0];

  const initial = parts[0].replace(/\.$/, '')[0] ?? '';
  const lastName = parts[parts.length - 1];

  return initial ? `${initial}.${lastName}` : lastName;
}

/**
 * Canonical display name for a bracket / score / walkover slot.
 * - null / bye   → 'TBD' / 'Bye'
 * - singles      → full name
 * - doubles pair → "გ.ლატარია / ბ.თედია"
 */
export function getPlayerDisplayName(player: Player | null | undefined): string {
  if (!player) return 'TBD';
  if (checkIsBye(player.name)) return player.name;

  const partner = player.partner;
  const isDoubles = Boolean(partner) || looksLikePair(player.name);
  if (!isDoubles) return player.name;

  // Left side: handle both "გიორგი ლატარია" and "გიორგი / ბექა".
  const leftRaw = looksLikePair(player.name)
    ? player.name.split('/')[0].trim()
    : player.name;
  const left = shortName(leftRaw);

  if (!partner) return left;

  const partnerFull = [partner.firstName, partner.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  const right = shortName(partnerFull);

  return right ? `${left} / ${right}` : left;
}