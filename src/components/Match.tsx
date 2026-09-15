'use client';

import { PlayerRow } from './PlayerRow';
import type { MatchDetail, Player } from '../lib/types';

interface Props {
  p1: Player | null;
  p2: Player | null;
  details: MatchDetail | null;
  round: number;
  matchIdx: number;
  top: number;
  height: number;
  onClick: (round: number, matchIdx: number, playerIndex: 0 | 1) => void;
}

export function Match({
  p1,
  p2,
  details,
  round,
  matchIdx,
  top,
  height,
  onClick,
}: Props) {
  const isTbd = !p1 && !p2;

  return (
    <div
      className={`absolute left-0 flex w-full flex-col justify-center overflow-hidden rounded-md transition-all duration-200 ${
        isTbd
          ? 'border border-dashed border-line-2 bg-overlay shadow-none'
          : 'border border-l-4 border-line border-l-line-2 bg-card shadow-card hover:-translate-y-0.5 hover:shadow-card-hover'
      }`}
      style={{ top: `${top}px`, height: `${height}px` }}
    >
      <PlayerRow
        player={p1}
        round={round}
        slotIndex={matchIdx * 2}
        details={details}
        playerIndex={0}
        onClick={!isTbd ? () => onClick(round, matchIdx, 0) : undefined}
      />
      <PlayerRow
        player={p2}
        round={round}
        slotIndex={matchIdx * 2 + 1}
        details={details}
        playerIndex={1}
        onClick={!isTbd ? () => onClick(round, matchIdx, 1) : undefined}
      />
    </div>
  );
}