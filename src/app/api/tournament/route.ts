import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getTournament, saveTournament } from '../../../lib/tournament-repo';
import { verifySessionToken, SESSION_COOKIE } from '../../../lib/auth';
import type { TournamentState } from '../../../lib/types';

const EMPTY: TournamentState = {
  playersList: [],
  bracketData: [],
  matchDetails: [],
  registrations: [],
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') === 'doubles' ? 'doubles' : 'singles';

    const state = await getTournament(mode);
    return NextResponse.json(state ?? EMPTY);
  } catch (error) {
    console.error('API GET /api/tournament error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament state' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!(await verifySessionToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as { mode?: string } & Partial<TournamentState>;
    const mode = body.mode === 'doubles' ? 'doubles' : 'singles';

    await saveTournament(mode, {
      playersList: body.playersList ?? [],
      bracketData: body.bracketData ?? [],
      matchDetails: body.matchDetails ?? [],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('API PUT /api/tournament error:', error);
    return NextResponse.json(
      { error: 'Failed to save tournament state' },
      { status: 500 }
    );
  }
}