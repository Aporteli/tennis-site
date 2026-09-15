'use client';

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { computeStats } from '../lib/tournament/bracket';
import type {
  BracketData,
  MatchDetails,
  MatchInfo,
  PendingWalkover,
  Player,
  SetScore,
} from '../lib/types';

interface Params {
  bracketData: BracketData;
  matchDetails: MatchDetails;
  players: Player[];
  persist: (bd: BracketData, md: MatchDetails, pl: Player[]) => Promise<void>;
  pushHistory: () => void;
  setBracketData: Dispatch<SetStateAction<BracketData>>;
  setMatchDetails: Dispatch<SetStateAction<MatchDetails>>;
}

export function useMatchActions({
  bracketData,
  matchDetails,
  players,
  persist,
  pushHistory,
  setBracketData,
  setMatchDetails,
}: Params) {
  // ── Save score ──────────────────────────────────────────────────────
  const saveScore = useCallback(
    (info: MatchInfo, sets: SetScore[]) => {
      pushHistory();

      let p1Wins = 0;
      let p2Wins = 0;
      sets.forEach((s) => {
        if (s.p1 > s.p2) p1Wins++;
        else if (s.p2 > s.p1) p2Wins++;
      });

      const winnerIndex = (p1Wins >= p2Wins ? 0 : 1) as 0 | 1;
      const winner = winnerIndex === 0 ? info.p1 : info.p2;

      const bd = bracketData.map((r) => [...r]);
      const md = matchDetails.map((r) => [...r]);
      const s = computeStats(players);

      if (!md[info.r]) {
        md[info.r] = new Array(s.size / Math.pow(2, info.r + 1)).fill(null);
      }
      md[info.r][info.matchIdx] = { sets, winnerIndex };

      if (info.r < bd.length - 1) {
        if (!bd[info.r + 1]) {
          bd[info.r + 1] = new Array(
            s.size / Math.pow(2, info.r + 2),
          ).fill(null);
        }
        bd[info.r + 1][info.matchIdx] = winner;
      }

      setBracketData(bd);
      setMatchDetails(md);
      persist(bd, md, players);
    },
    [
      bracketData,
      matchDetails,
      players,
      persist,
      pushHistory,
      setBracketData,
      setMatchDetails,
    ],
  );

  // ── Walkover ────────────────────────────────────────────────────────
  const confirmWalkover = useCallback(
    (wo: PendingWalkover) => {
      pushHistory();

      const bd = bracketData.map((r) => [...r]);
      const md = matchDetails.map((r) => [...r]);
      const s = computeStats(players);

      if (wo.r < bd.length - 1) {
        if (!bd[wo.r + 1]) {
          bd[wo.r + 1] = new Array(
            s.size / Math.pow(2, wo.r + 2),
          ).fill(null);
        }
        bd[wo.r + 1][wo.matchIdx] = wo.existingPlayer;

        if (!md[wo.r]) {
          md[wo.r] = new Array(
            s.size / Math.pow(2, wo.r + 1),
          ).fill(null);
        }
        md[wo.r][wo.matchIdx] = {
          isWalkover: true,
          winnerIndex: wo.winnerIndex,
        };
      }

      setBracketData(bd);
      setMatchDetails(md);
      persist(bd, md, players);
    },
    [
      bracketData,
      matchDetails,
      players,
      persist,
      pushHistory,
      setBracketData,
      setMatchDetails,
    ],
  );

  return { saveScore, confirmWalkover };
}