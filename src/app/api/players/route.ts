import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../lib/prisma';
import {
  addPlayerToTournament,
  placeApprovedPlayerInTournament,
  removePlayerFromTournament,
} from '../../../lib/tournament-repo';
import { verifySessionToken, SESSION_COOKIE } from '../../../lib/auth';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** "First Last" for singles, "First Last / PartnerFirst PartnerLast" for doubles teams. */
function buildDisplayName(p: {
  firstName: string;
  lastName: string;
  partner?: { firstName: string; lastName: string } | null;
}): string {
  const self = `${p.firstName} ${p.lastName}`.trim();
  if (!p.partner) return self;
  const other = `${p.partner.firstName} ${p.partner.lastName}`.trim();
  return `${self} / ${other}`;
}

// ─────────────────────────────────────────────────────────────
// 1. GET — list players (optionally filter by mode/status)
// ─────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') === 'doubles' ? 'doubles' : 'singles';
    const status = searchParams.get('status');

    const players = await prisma.player.findMany({
      where: {
        mode,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        partner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            seed: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error('GET /api/players error:', error);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// 2. POST — register (singles player OR doubles pair)
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, phone, mode = 'singles', partner } = body;

    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'სახელი, გვარი და ტელეფონის ნომერი სავალდებულოა' },
        { status: 400 },
      );
    }

    // ── DOUBLES: create two players + link them ──
    if (mode === 'doubles') {
      if (!partner?.firstName || !partner?.lastName || !partner?.phone) {
        return NextResponse.json(
          { error: 'პარტნიორის სახელი, გვარი და ტელეფონი სავალდებულოა' },
          { status: 400 },
        );
      }

      const [playerA, playerB] = await prisma.$transaction(async (tx) => {
        const a = await tx.player.create({
          data: {
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            phone: String(phone).trim(),
            mode: 'doubles',
            status: 'PENDING',
          },
        });

        const b = await tx.player.create({
          data: {
            firstName: String(partner.firstName).trim(),
            lastName: String(partner.lastName).trim(),
            phone: String(partner.phone).trim(),
            mode: 'doubles',
            status: 'PENDING',
          },
        });

        // link both directions (1-to-1 self relation)
        await tx.player.update({ where: { id: a.id }, data: { partnerId: b.id } });
        await tx.player.update({ where: { id: b.id }, data: { partnerId: a.id } });

        return [a, b] as const;
      });

      return NextResponse.json({ players: [playerA, playerB] }, { status: 201 });
    }

    // ── SINGLES ──
    const newPlayer = await prisma.player.create({
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        phone: String(phone).trim(),
        mode: 'singles',
        status: 'PENDING',
      },
    });

    return NextResponse.json(newPlayer, { status: 201 });
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// 3. PATCH — update status / seed / info / assign to tournament
// ─────────────────────────────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, seed, firstName, lastName, phone, assignMode } = body;

    if (!id) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    const assignTo =
      assignMode === 'doubles' ? 'doubles' : assignMode === 'singles' ? 'singles' : null;

    // Auth: only required for status/seed/tournament changes
    if (assignTo || status || seed !== undefined) {
      const cookieStore = await cookies();
      const token = cookieStore.get(SESSION_COOKIE)?.value;
      if (!(await verifySessionToken(token))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Fetch existing player + partner (needed for team name, status mirroring)
    const existing = await prisma.player.findUnique({
      where: { id },
      include: { partner: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // ── Tournament assignment ──
    if (assignTo) {
      const otherMode = assignTo === 'singles' ? 'doubles' : 'singles';

      // For doubles teams, always use the combined name so the entry is one team.
      const playerName =
        assignTo === 'doubles' ? buildDisplayName(existing) : `${existing.firstName} ${existing.lastName}`.trim();

      // Remove from the *other* tournament (in case it moved modes)
      await removePlayerFromTournament(otherMode, id, playerName);

      await addPlayerToTournament(assignTo, {
        id: existing.id,
        name: playerName,
        seed: existing.seed,
        status: existing.status,
        mode: assignTo,
        partner:
          assignTo === 'doubles' && existing.partner
            ? {
                id: existing.partner.id,
                firstName: existing.partner.firstName,
                lastName: existing.partner.lastName,
                phone: existing.partner.phone,
                seed: existing.partner.seed,
                status: existing.partner.status,
              }
            : null,
      });
    }

    // ── Apply updates ──
    const updatedPlayer = await prisma.$transaction(async (tx) => {
      const updated = await tx.player.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(seed !== undefined ? { seed } : {}),
          ...(assignTo ? { mode: assignTo } : {}),
          ...(firstName ? { firstName: String(firstName).trim() } : {}),
          ...(lastName ? { lastName: String(lastName).trim() } : {}),
          ...(phone ? { phone: String(phone).trim() } : {}),
        },
      });

      // Mirror status to partner so the pair stays in sync.
      if (status && existing.partnerId && existing.mode === 'doubles') {
        await tx.player.update({
          where: { id: existing.partnerId },
          data: { status },
        });
      }

      // If we just moved a paired player into singles, break the link.
      if (assignTo === 'singles' && existing.partnerId) {
        await tx.player.update({
          where: { id: existing.partnerId },
          data: { partnerId: null },
        });
        await tx.player.update({
          where: { id },
          data: { partnerId: null },
        });
      }

      return updated;
    });

    // Approval writes the player (or doubles team) into that format's
    // tournament list so PlayersModal / the draw pick them up.
    if (status === 'APPROVED' && !assignTo) {
      await placeApprovedPlayerInTournament(existing);
    }

    return NextResponse.json(updatedPlayer);
  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
// 4. DELETE — remove player (and clean up partner + tournament)
// ─────────────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!(await verifySessionToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    const existing = await prisma.player.findUnique({
      where: { id },
      include: { partner: true },
    });
    if (!existing) {
      return NextResponse.json({ ok: true }); // already gone
    }

    // Remove from tournament lists (by id + by name; both are tried)
    const selfName = `${existing.firstName} ${existing.lastName}`.trim();
    const teamName = buildDisplayName(existing);

    await removePlayerFromTournament('singles', id, selfName);
    await removePlayerFromTournament('doubles', id, teamName);

    if (existing.partner) {
      const partnerName = `${existing.partner.firstName} ${existing.partner.lastName}`.trim();
      await removePlayerFromTournament('singles', existing.partner.id, partnerName);
      await removePlayerFromTournament('doubles', existing.partner.id, teamName);
    }

    // Delete — partner_id on the other side becomes null (onDelete: SetNull).
    await prisma.player.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete Error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}