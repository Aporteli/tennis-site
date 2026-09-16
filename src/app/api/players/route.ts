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
import { levenshtein } from '../../../lib/levenshtein';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const HONEYPOT_FIELDS = [
  'website',
  'company',
  'email2',
  'username',
  'fax',
  'address',
  'url',
] as const;

const PHONE_RE = /^\d{9}$/;
const MAX_NAME_LEN = 80;
const MIN_FORM_FILL_MS = 2000;

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

/**
 * Search approved doubles pairs for one that would duplicate the incoming pair.
 *
 * The rule is a "double lock":
 *   - Both names within 2 edits of the approved pair's names (order-independent)
 *   - AND at least one phone within 1 edit of the corresponding approved phone
 *
 * Both conditions must hold, otherwise we'd risk blocking legitimate new pairs.
 */
async function findBlockingDuplicate(input: {
  names: [string, string];
  phones: [string, string];
}): Promise<{ id: string; name: string } | null> {
  const candidates = await prisma.player.findMany({
    where: {
      mode: 'doubles',
      status: 'APPROVED',
      partnerId: { not: null },
    },
    include: { partner: true },
  });

  const seen = new Set<string>();

  for (const c of candidates) {
    if (!c.partner) continue;
    const key = [c.id, c.partner.id].sort().join('::');
    if (seen.has(key)) continue;
    seen.add(key);

    const exNames: [string, string] = [
      `${c.firstName} ${c.lastName}`.toLowerCase().trim(),
      `${c.partner.firstName} ${c.partner.lastName}`.toLowerCase().trim(),
    ];
    const exPhones: [string, string] = [c.phone, c.partner.phone];
    const inNames: [string, string] = [
      input.names[0].toLowerCase().trim(),
      input.names[1].toLowerCase().trim(),
    ];
    const inPhones: [string, string] = input.phones;

    // Names must match in either order.
    const directNames =
      levenshtein(inNames[0], exNames[0]) <= 2 &&
      levenshtein(inNames[1], exNames[1]) <= 2;
    const swappedNames =
      levenshtein(inNames[0], exNames[1]) <= 2 &&
      levenshtein(inNames[1], exNames[0]) <= 2;

    if (!directNames && !swappedNames) continue;

    // Phones: only one close match is enough to confirm.
    const phoneNear =
      levenshtein(inPhones[0], exPhones[0]) <= 1 ||
      levenshtein(inPhones[0], exPhones[1]) <= 1 ||
      levenshtein(inPhones[1], exPhones[0]) <= 1 ||
      levenshtein(inPhones[1], exPhones[1]) <= 1;

    if (phoneNear) {
      return {
        id: c.id,
        name: `${c.firstName} ${c.lastName} / ${c.partner.firstName} ${c.partner.lastName}`,
      };
    }
  }

  return null;
}

/**
 * Search approved singles for one that would duplicate the incoming player.
 * Requires name within 2 edits AND phone within 1 edit.
 */
async function findBlockingSingle(input: {
  name: string;
  phone: string;
}): Promise<{ id: string; name: string } | null> {
  const approved = await prisma.player.findMany({
    where: { mode: 'singles', status: 'APPROVED' },
    select: { id: true, firstName: true, lastName: true, phone: true },
  });

  const incomingName = input.name.toLowerCase().trim();

  for (const s of approved) {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase().trim();
    const nameNear = levenshtein(incomingName, name) <= 2;
    const phoneNear = levenshtein(input.phone, s.phone) <= 1;

    if (nameNear && phoneNear) {
      return { id: s.id, name: `${s.firstName} ${s.lastName}` };
    }
  }

  return null;
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
      openedAt,
      ...honeypots
    } = body ?? {};

    const mode: 'singles' | 'doubles' =
      rawMode === 'doubles' ? 'doubles' : 'singles';

    // ── 1. Honeypot check ─────────────────────────────────────────
    for (const field of HONEYPOT_FIELDS) {
      const value = honeypots[field];
      if (typeof value === 'string' && value.trim() !== '') {
        return NextResponse.json(fakeSuccess(mode), { status: 201 });
      }
    }

    // ── 2. Timing check ──────────────────────────────────────────
    if (typeof openedAt === 'number' && Number.isFinite(openedAt)) {
      if (Date.now() - openedAt < MIN_FORM_FILL_MS) {
        return NextResponse.json(fakeSuccess(mode), { status: 201 });
      }
    }

    // ── 3. Server-side validation ─────────────────────────────────
    const cleanFirst = cleanName(firstName);
    const cleanLast = cleanName(lastName);
    const cleanPhone = parsePhone(phone);

    if (!cleanFirst || !cleanLast || !cleanPhone) {
      return NextResponse.json(
        { error: 'სახელი, გვარი და ტელეფონის ნომერი სავალდებულოა' },
        { status: 400 },
      );
    }

    // ── DOUBLES ───────────────────────────────────────────────────
    if (mode === 'doubles') {
      const pFirst = cleanName(partner?.firstName);
      const pLast = cleanName(partner?.lastName);
      const pPhone = parsePhone(partner?.phone);

      if (!pFirst || !pLast || !pPhone) {
        return NextResponse.json(
          { error: 'პარტნიორის სახელი, გვარი და ტელეფონი სავალდებულოა' },
          { status: 400 },
        );
      }

      if (cleanPhone === pPhone) {
        return NextResponse.json(
          { error: 'პარტნიორის ნომერი უნდა განსხვავდებოდეს თქვენისგან' },
          { status: 400 },
        );
      }

      // ── Block near-duplicate of an already-approved pair ──────
      const blocking = await findBlockingDuplicate({
        names: [`${cleanFirst} ${cleanLast}`, `${pFirst} ${pLast}`],
        phones: [cleanPhone, pPhone],
      });

      if (blocking) {
        return NextResponse.json(
          {
            error:
              'ეს წყვილი უკვე დარეგისტრირებულია. თუ ფიქრობთ, რომ ეს შეცდომაა, დაუკავშირდით ადმინისტრატორს.',
            duplicateOf: blocking.name,
          },
          { status: 409 },
        );
      }

      // ── Create the pair ───────────────────────────────────────
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

    // ── SINGLES ───────────────────────────────────────────────────
    const blockingSingle = await findBlockingSingle({
      name: `${cleanFirst} ${cleanLast}`,
      phone: cleanPhone,
    });

    if (blockingSingle) {
      return NextResponse.json(
        {
          error:
            'ეს მოთამაშე უკვე დარეგისტრირებულია. თუ ფიქრობთ, რომ ეს შეცდომაა, დაუკავშირდით ადმინისტრატორს.',
          duplicateOf: blockingSingle.name,
        },
        { status: 409 },
      );
    }

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
    // ── Auth: every PATCH is a mutation, no exceptions ────────────
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!(await verifySessionToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, seed, firstName, lastName, phone, assignMode } = body;

    if (!id) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    const assignTo =
      assignMode === 'doubles'
        ? 'doubles'
        : assignMode === 'singles'
          ? 'singles'
          : null;

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
        assignTo === 'doubles'
          ? buildDisplayName(existing)
          : `${existing.firstName} ${existing.lastName}`.trim();

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
      await placeApprovedPlayerInTournament(updatedPlayer);
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