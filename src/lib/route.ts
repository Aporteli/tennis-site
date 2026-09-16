import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../lib/prisma';
import {
  addPlayerToTournament,
  placeApprovedPlayerInTournament,
  removePlayerFromTournament,
} from '../../../lib/tournament-repo';
import { verifySessionToken, SESSION_COOKIE } from '../../../lib/auth';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit';

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

/** Honeypot names — must match the client's `HONEYPOT_NAMES`. */
const HONEYPOT_FIELDS = ['website', 'company', 'email2', 'username', 'fax', 'address', 'url'] as const;

/** 9-digit phone, exactly. Server never trusts the client's regex. */
const PHONE_RE = /^\d{9}$/;

const MAX_NAME_LEN = 80;
const MIN_FORM_FILL_MS = 2000;

function cleanName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().slice(0, MAX_NAME_LEN);
}

function parsePhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const digits = raw.replace(/\D/g, '');
  return PHONE_RE.test(digits) ? digits : null;
}

/** Fake success body that matches a real singles/doubles success shape. */
function fakeSuccess(mode: 'singles' | 'doubles') {
  const fakeId = `hp_${Math.random().toString(36).slice(2, 12)}`;
  if (mode === 'doubles') {
    return {
      players: [
        { id: `${fakeId}_a`, firstName: 'ok', lastName: 'ok', mode: 'doubles', status: 'PENDING' },
        { id: `${fakeId}_b`, firstName: 'ok', lastName: 'ok', mode: 'doubles', status: 'PENDING' },
      ],
    };
  }
  return {
    id: fakeId,
    firstName: 'ok',
    lastName: 'ok',
    mode: 'singles',
    status: 'PENDING',
  };
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
    // ── 0. Rate limit by IP (5 registrations / hour) ──────────────
    const ip = getClientIp(req);
    const rl = checkRateLimit(`register:${ip}`, 5, 60 * 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'ძალიან ბევრი მცდელობა. სცადეთ მოგვიანებით.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)),
          },
        },
      );
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      phone,
      mode: rawMode = 'singles',
      partner,
      openedAt, // ms epoch, sent by the client
      ...honeypots // remaining keys are honeypot fields if present
    } = body ?? {};

    const mode: 'singles' | 'doubles' = rawMode === 'doubles' ? 'doubles' : 'singles';

    // ── 1. Honeypot check ─────────────────────────────────────────
    // A real client never fills these. Silent fake success so the bot
    // learns nothing and we never touch the DB.
    for (const field of HONEYPOT_FIELDS) {
      const value = honeypots[field];
      if (typeof value === 'string' && value.trim() !== '') {
        return NextResponse.json(fakeSuccess(mode), { status: 201 });
      }
    }

    // ── 2. Timing check ──────────────────────────────────────────
    // If the form was filled in under MIN_FORM_FILL_MS, it's automated.
    if (typeof openedAt === 'number' && Number.isFinite(openedAt)) {
      if (Date.now() - openedAt < MIN_FORM_FILL_MS) {
        return NextResponse.json(fakeSuccess(mode), { status: 201 });
      }
    }

    // ── 3. Server-side validation (never trust the client) ────────
    const cleanFirst = cleanName(firstName);
    const cleanLast = cleanName(lastName);
    const cleanPhone = parsePhone(phone);

    if (!cleanFirst || !cleanLast || !cleanPhone) {
      return NextResponse.json({ error: 'სახელი, გვარი და ტელეფონის ნომერი სავალდებულოა' }, { status: 400 });
    }

    // ── DOUBLES: create two players + link them ───────────────────
    if (mode === 'doubles') {
      const pFirst = cleanName(partner?.firstName);
      const pLast = cleanName(partner?.lastName);
      const pPhone = parsePhone(partner?.phone);

      if (!pFirst || !pLast || !pPhone) {
        return NextResponse.json({ error: 'პარტნიორის სახელი, გვარი და ტელეფონი სავალდებულოა' }, { status: 400 });
      }

      // Guard against registering the same person as their own partner.
      if (cleanPhone === pPhone) {
        return NextResponse.json({ error: 'პარტნიორის ნომერი უნდა განსხვავდებოდეს თქვენისგან' }, { status: 400 });
      }

      const [playerA, playerB] = await prisma.$transaction(async (tx) => {
        const a = await tx.player.create({
          data: {
            firstName: cleanFirst,
            lastName: cleanLast,
            phone: cleanPhone,
            mode: 'doubles',
            status: 'PENDING',
          },
        });

        const b = await tx.player.create({
          data: {
            firstName: pFirst,
            lastName: pLast,
            phone: pPhone,
            mode: 'doubles',
            status: 'PENDING',
          },
        });

        await tx.player.update({ where: { id: a.id }, data: { partnerId: b.id } });
        await tx.player.update({ where: { id: b.id }, data: { partnerId: a.id } });

        return [a, b] as const;
      });

      return NextResponse.json({ players: [playerA, playerB] }, { status: 201 });
    }

    // ── SINGLES ──────────────────────────────────────────────────
    const newPlayer = await prisma.player.create({
      data: {
        firstName: cleanFirst,
        lastName: cleanLast,
        phone: cleanPhone,
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

    const assignTo = assignMode === 'doubles' ? 'doubles' : assignMode === 'singles' ? 'singles' : null;

    if (assignTo || status || seed !== undefined) {
      const cookieStore = await cookies();
      const token = cookieStore.get(SESSION_COOKIE)?.value;
      if (!(await verifySessionToken(token))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const existing = await prisma.player.findUnique({
      where: { id },
      include: { partner: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    if (assignTo) {
      const otherMode = assignTo === 'singles' ? 'doubles' : 'singles';

      const playerName =
        assignTo === 'doubles' ? buildDisplayName(existing) : `${existing.firstName} ${existing.lastName}`.trim();

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

      if (status && existing.partnerId && existing.mode === 'doubles') {
        await tx.player.update({
          where: { id: existing.partnerId },
          data: { status },
        });
      }

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
      return NextResponse.json({ ok: true });
    }

    const selfName = `${existing.firstName} ${existing.lastName}`.trim();
    const teamName = buildDisplayName(existing);

    await removePlayerFromTournament('singles', id, selfName);
    await removePlayerFromTournament('doubles', id, teamName);

    if (existing.partner) {
      const partnerName = `${existing.partner.firstName} ${existing.partner.lastName}`.trim();
      await removePlayerFromTournament('singles', existing.partner.id, partnerName);
      await removePlayerFromTournament('doubles', existing.partner.id, teamName);
    }

    await prisma.player.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete Error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
