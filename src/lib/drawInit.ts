import {  computeStats, initBracketData } from './tournament/bracket';
import { buildSlots } from './tournament/seeding';
import type { BracketData, MatchDetails, Player } from './types';

export interface InitialBracket {
  bracketData: BracketData;
  matchDetails: MatchDetails;
  stats: ReturnType<typeof computeStats>;
  slots: ReturnType<typeof buildSlots>;
}

/**
 * Builds a fresh bracket seeded with all seed players from `players`.
 * Shared by initial load, savePlayers, resetDraw and generateDraw.
 */
export function buildInitialBracket(players: Player[]): InitialBracket {
  const stats = computeStats(players);
  const { bracketData, matchDetails } = initBracketData(stats.size);
  const slots = buildSlots(players);

  for (let i = 0; i < stats.size; i++) {
    const slot = slots[i];
    if (slot && slot.seed) bracketData[0][i] = slot;
  }

  return { bracketData, matchDetails, stats, slots };
}