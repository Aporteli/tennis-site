import type { Mode, Player } from './types';
import { checkIsBye, shortName } from './tournament/helpers';

function looksLikePair(name: string): boolean {
  return name.includes('/');
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Admin-validated (or a curated draw-list row with no status, e.g. typed in). */
function isValidated(player: Player): boolean {
  return player.status == null || player.status === 'APPROVED';
}

/**
 * Which format this entry belongs to.
 * Prefer assignedMode (which tournament they were placed in) over registration mode,
 * so a singles draw cannot leak into the doubles list.
 */
export function playerBelongsToMode(player: Player, mode: Mode): boolean {
  const assigned = player.assignedMode ?? player.mode;
  if (assigned === 'singles' || assigned === 'doubles') {
    return assigned === mode;
  }

  const isDoubles = Boolean(player.partner) || looksLikePair(player.name);
  return mode === 'doubles' ? isDoubles : !isDoubles;
}

function playerKey(player: Player): string {
  if (player.id) return `id:${player.id}`;
  return `name:${normalizeName(player.name)}`;
}

function labelKey(player: Player, mode: Mode): string {
  const label = mode === 'doubles' ? formatDoublesPairLabel(player) : player.name;
  return normalizeName(label);
}

function dedupePairs(players: Player[]): Player[] {
  const seen = new Set<string>();
  return players.filter((p) => {
    if (!p.partner || !p.id) return true;
    const partnerId = p.partner.id;
    if (!partnerId) return true;
    const key = [p.id, partnerId].sort().join('::');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** "გ.ლატარია / ბ.თედია" — short-form label for a doubles pair. */
export function formatDoublesPairLabel(player: Player): string {
  const partner = player.partner;

  const left = looksLikePair(player.name)
    ? shortName(player.name.split('/')[0].trim())
    : shortName(player.name);

  if (!partner) return left;

  const partnerFull = [partner.firstName, partner.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  const right = shortName(partnerFull);

  return right ? `${left} / ${right}` : left;
}

/**
 * Build the value shown inside PlayersModal's textarea.
 * - singles → "სახელი გვარი"
 * - doubles → "გ.ლატარია / ბ.თედია"
 * Seeds are prefixed as "<n>. ".
 */
export function formatPlayersModalValue(
  mode: Mode,
  players: Player[],
  registrations: Player[] = [],
): string {
  const byKey = new Map<string, Player>();

  const consider = (player: Player | null | undefined, overwrite: boolean) => {
    if (!player?.name) return;
    if (checkIsBye(player.name) || player.bye) return;
    if (!isValidated(player)) return;
    if (!playerBelongsToMode(player, mode)) return;

    const key = playerKey(player);
    if (!overwrite && byKey.has(key)) return;
    byKey.set(key, player);
  };

  for (const p of players) consider(p, false);
  for (const r of registrations) consider(r, true);

  const deduped = dedupePairs(Array.from(byKey.values()));

  const seenLabels = new Set<string>();
  const unique = deduped.filter((p) => {
    const key = labelKey(p, mode);
    if (seenLabels.has(key)) return false;
    seenLabels.add(key);
    return true;
  });

  return unique
    .map((p) => {
      const label = mode === 'doubles' ? formatDoublesPairLabel(p) : p.name;
      return p.seed != null ? `${p.seed}. ${label}` : label;
    })
    .join('\n');
}