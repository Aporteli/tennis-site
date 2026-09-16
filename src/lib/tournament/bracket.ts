import type { BracketData, MatchDetails, Player, TournamentStats } from '../types';
import { checkIsBye, nextPow2 } from './helpers';

export function computeStats(players: Player[]): TournamentStats {
  const realPlayers = players.filter((p) => !checkIsBye(p.name));
  const total = realPlayers.length;
  const size = nextPow2(total || 1);
  const byes = size - total;
  const seeds = realPlayers.filter((p) => Boolean(p.seed)).length;
  return { total, size, byes, seeds };
}

export function initBracketData(bracketSize: number): {
  bracketData: BracketData;
  matchDetails: MatchDetails;
} {
  const bracketData: BracketData = [];
  const matchDetails: MatchDetails = [];
  let currentSize = bracketSize;
  const numRounds = Math.log2(bracketSize);

  for (let r = 0; r < numRounds; r++) {
    bracketData.push(new Array(currentSize).fill(null));
    matchDetails.push(new Array(currentSize / 2).fill(null));
    currentSize = currentSize / 2;
  }

  return { bracketData, matchDetails };
}