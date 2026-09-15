import { prisma } from './prisma';
import { Prisma } from '../generated/prisma/client';
import type { BracketData, MatchDetails, Player, TournamentState } from './types';

type MatchMode = 'singles' | 'doubles';

type PartnerInfo = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  seed: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
};

type DbPlayerWithPartner = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  seed: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  mode: string;
  partner: PartnerInfo | null;
};

function toPlayer(p: DbPlayerWithPartner): Player {
  return {
    id: p.id,
    name: `${p.firstName} ${p.lastName}`.trim(),
    seed: p.seed,
    status: p.status,
    mode: p.mode as Player['mode'],
    phone: p.phone,
    partner: p.partner
      ? {
          id: p.partner.id,
          firstName: p.partner.firstName,
          lastName: p.partner.lastName,
          phone: p.partner.phone,
          seed: p.partner.seed,
          status: p.partner.status ?? 'PENDING',
        }
      : null,
  };
}

function playerListIds(list: Player[]): Set<string> {
  return new Set(list.map((p) => p.id).filter((id): id is string => Boolean(id)));
}

export async function getTournament(mode: string): Promise<TournamentState | null> {
  const modeEnum = mode as MatchMode;

  const [row, allTournaments, dbPlayers] = await Promise.all([
    prisma.tournament.findUnique({ where: { mode: modeEnum } }),
    prisma.tournament.findMany({ select: { mode: true, playersList: true } }),
    prisma.player.findMany({
      include: {
        partner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            seed: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const singlesIds = playerListIds(
    (allTournaments.find((t) => t.mode === 'singles')?.playersList as unknown as Player[]) ?? [],
  );
  const doublesIds = playerListIds(
    (allTournaments.find((t) => t.mode === 'doubles')?.playersList as unknown as Player[]) ?? [],
  );

  const registrations = dbPlayers.map((p) => {
    const player = toPlayer(p as DbPlayerWithPartner);
    if (!player.id) return player;

    const inSingles = singlesIds.has(player.id);
    const inDoubles = doublesIds.has(player.id);

    const dbMode: Player['assignedMode'] =
      p.mode === 'doubles' ? 'doubles' : p.mode === 'singles' ? 'singles' : undefined;

    const assignedMode: Player['assignedMode'] =
      inSingles && inDoubles
        ? dbMode
        : inSingles
          ? 'singles'
          : inDoubles
            ? 'doubles'
            : undefined;

    return { ...player, assignedMode };
  });

  if (!row && registrations.length === 0) return null;

  return {
    playersList: (row?.playersList as unknown as Player[]) ?? [],
    bracketData: (row?.bracketData as unknown as BracketData) ?? [],
    matchDetails: (row?.matchDetails as unknown as MatchDetails) ?? [],
    registrations,
  };
}

export async function addPlayerToTournament(mode: string, player: Player): Promise<void> {
  const modeEnum = mode as MatchMode;
  const row = await prisma.tournament.findUnique({ where: { mode: modeEnum } });
  const playersList = (row?.playersList as unknown as Player[]) ?? [];

  const alreadyInDraw = playersList.some(
    (p) => (player.id && p.id === player.id) || p.name === player.name,
  );
  if (alreadyInDraw) return;

  await saveTournament(mode, {
    playersList: [
      ...playersList,
      {
        id: player.id,
        name: player.name,
        seed: player.seed ?? null,
        status: 'APPROVED',
        mode: mode as Player['mode'],
        partner: player.partner ?? null,
      },
    ],
    bracketData: (row?.bracketData as unknown as BracketData) ?? [],
    matchDetails: (row?.matchDetails as unknown as MatchDetails) ?? [],
  });
}

export async function removePlayerFromTournament(
  mode: string,
  playerId: string,
  playerName?: string,
): Promise<void> {
  const modeEnum = mode as MatchMode;
  const row = await prisma.tournament.findUnique({ where: { mode: modeEnum } });
  if (!row) return;

  const playersList = (row.playersList as unknown as Player[]) ?? [];
  const next = playersList.filter((p) => {
    if (p.id && p.id === playerId) return false;
    if (playerName && p.name === playerName) return false;
    return true;
  });
  if (next.length === playersList.length) return;

  await saveTournament(mode, {
    playersList: next,
    bracketData: (row.bracketData as unknown as BracketData) ?? [],
    matchDetails: (row.matchDetails as unknown as MatchDetails) ?? [],
  });
}

/**
 * Called when an admin approves a registration.
 * Adds the player (singles) or the combined pair (doubles) to the tournament's
 * playersList so it shows up in the draw-management UI (PlayersModal) and
 * feeds the bracket builder.
 *
 * Idempotent — checks by player id, partner id, and both name orderings.
 */
export async function placeApprovedPlayerInTournament(player: {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  seed: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  mode: string;
  partnerId?: string | null;
  partner?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    seed: number | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  } | null;
}): Promise<void> {
  const targetMode: MatchMode = player.mode === 'doubles' ? 'doubles' : 'singles';

  const selfName = `${player.firstName} ${player.lastName}`.trim();

  // Name variants — for doubles we accept either ordering of the pair.
  let names: string[];
  if (targetMode === 'doubles' && player.partner) {
    const other = `${player.partner.firstName} ${player.partner.lastName}`.trim();
    names = [`${selfName} / ${other}`, `${other} / ${selfName}`];
  } else {
    names = [selfName];
  }

  const row = await prisma.tournament.findUnique({ where: { mode: targetMode } });
  const list = (row?.playersList as unknown as Player[]) ?? [];

  // Already in the draw? Match by any of:
  //   - this player's id
  //   - partner's id (in case we're approving the second half of a pair)
  //   - either name ordering
  const alreadyIn = list.some((p) => {
    if (p.id && p.id === player.id) return true;
    if (player.partnerId && p.id && p.id === player.partnerId) return true;
    if (p.name && names.includes(p.name)) return true;
    return false;
  });
  if (alreadyIn) return;

  await saveTournament(targetMode, {
    playersList: [
      ...list,
      {
        id: player.id,
        name: names[0],
        seed: player.seed ?? null,
        status: 'APPROVED',
        mode: targetMode,
        partner: player.partner
          ? {
              id: player.partner.id,
              firstName: player.partner.firstName,
              lastName: player.partner.lastName,
              phone: player.partner.phone ?? '',
              seed: player.partner.seed,
              status: player.partner.status,
            }
          : null,
      },
    ],
    bracketData: (row?.bracketData as unknown as BracketData) ?? [],
    matchDetails: (row?.matchDetails as unknown as MatchDetails) ?? [],
  });
}

export async function saveTournament(mode: string, state: TournamentState): Promise<void> {
  const modeEnum = mode as MatchMode;

  const data = {
    playersList: state.playersList as unknown as Prisma.InputJsonValue,
    bracketData: state.bracketData as unknown as Prisma.InputJsonValue,
    matchDetails: state.matchDetails as unknown as Prisma.InputJsonValue,
  };

  await prisma.tournament.upsert({
    where: { mode: modeEnum },
    create: { mode: modeEnum, ...data },
    update: data,
  });
}