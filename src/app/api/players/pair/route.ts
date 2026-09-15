import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../lib/prisma';
import { verifySessionToken, SESSION_COOKIE } from '../../../../lib/auth';

async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

// ── POST: pair two players together (1-to-1, breaks any existing pairs) ──
export async function POST(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, partnerId } = await req.json();

    if (!id || !partnerId) {
      return NextResponse.json({ error: 'id and partnerId required' }, { status: 400 });
    }
    if (id === partnerId) {
      return NextResponse.json({ error: 'Cannot pair a player with themselves' }, { status: 400 });
    }

    const [a, b] = await Promise.all([
      prisma.player.findUnique({ where: { id } }),
      prisma.player.findUnique({ where: { id: partnerId } }),
    ]);

    if (!a || !b) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    if (a.mode !== 'doubles' || b.mode !== 'doubles') {
      return NextResponse.json({ error: 'Both players must be in doubles mode' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      if (a.partnerId && a.partnerId !== partnerId) {
        await tx.player.update({ where: { id: a.partnerId }, data: { partnerId: null } });
      }
      if (b.partnerId && b.partnerId !== id) {
        await tx.player.update({ where: { id: b.partnerId }, data: { partnerId: null } });
      }

      await tx.player.update({ where: { id }, data: { partnerId } });
      await tx.player.update({ where: { id: partnerId }, data: { partnerId: id } });
    });

    const updated = await prisma.player.findUnique({
      where: { id },
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
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Pair error:', error);
    return NextResponse.json({ error: 'Pairing failed' }, { status: 500 });
  }
}

// ── DELETE: unpair ──
export async function DELETE(req: Request) {
  if (!(await requireAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    if (!player.partnerId) {
      return NextResponse.json({ ok: true });
    }

    await prisma.$transaction([
      prisma.player.update({ where: { id }, data: { partnerId: null } }),
      prisma.player.update({ where: { id: player.partnerId }, data: { partnerId: null } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Unpair error:', error);
    return NextResponse.json({ error: 'Unpairing failed' }, { status: 500 });
  }
}