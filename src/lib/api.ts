import type { BracketData, MatchDetails, Mode, Player, TournamentState } from './types';

export const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<TournamentState>);

export interface PersistPayload {
  mode: Mode;
  bracketData: BracketData;
  matchDetails: MatchDetails;
  playersList: Player[];
}

export async function putTournament(payload: PersistPayload): Promise<void> {
  await fetch('/api/tournament', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function patchPlayerStatus(id: string, status: Player['status']): Promise<void> {
  await fetch('/api/players', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
}

export async function patchPlayerSeed(id: string, seed: number | null): Promise<void> {
  await fetch('/api/players', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, seed }),
  });
}

export async function assignPlayerToTournament(id: string, assignMode: Mode): Promise<void> {
  await fetch('/api/players', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, assignMode }),
  });
}

export async function deletePlayer(id: string): Promise<void> {
  await fetch(`/api/players?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ── Pairing ──
export async function pairPlayers(id: string, partnerId: string): Promise<void> {
  const res = await fetch('/api/players/pair', {
    // ← FIXED
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, partnerId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('[pairPlayers] FAILED', res.status, body, { id, partnerId });
    throw new Error(body.error || `Pairing failed (${res.status})`);
  }
}

export async function unpairPlayer(id: string): Promise<void> {
  const res = await fetch(`/api/players/pair?id=${encodeURIComponent(id)}`, {
    // ← FIXED
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error('[unpairPlayer] FAILED', res.status, body, { id });
    throw new Error(body.error || `Unpairing failed (${res.status})`);
  }
}
