'use client';

import { checkIsBye, getPlayerDisplayName } from '../lib/tournament/helpers';
import type { MatchDetail, Player } from '../lib/types';

interface Props {
  player: Player | null;
  round: number;
  slotIndex: number;
  details: MatchDetail | null;
  playerIndex: 0 | 1;
  onClick?: () => void;
}

export function PlayerRow({
  player,
  round,
  slotIndex,
  details,
  playerIndex,
  onClick,
}: Props) {
  if (!player) {
    return (
      <div className="flex h-1/2 items-center justify-between border-t border-line px-3 text-[13px] first:border-t-0">
        <div className="flex flex-1 items-baseline gap-2.5 overflow-hidden">
          <span className="font-mono text-xs text-ink-3">TBD</span>
        </div>
      </div>
    );
  }

  let isWinner = false;
  let scoresHtml: React.ReactNode = null;

  if (details) {
    if (details.winnerIndex === playerIndex) isWinner = true;
    if (details.isWalkover) {
      if (isWinner) {
        scoresHtml = (
          <div className="ml-3 flex gap-1">
            <span className="text-[11px] font-bold text-win">W/O</span>
          </div>
        );
      }
    } else if (details.sets) {
      const scores = details.sets.map((s) => (playerIndex === 0 ? s.p1 : s.p2));
      scoresHtml = (
        <div className="ml-3 flex gap-1">
          {scores.map((sc, i) => (
            <span
              key={i}
              className="min-w-[20px] text-center font-mono text-[13px] font-semibold"
            >
              {sc}
            </span>
          ))}
        </div>
      );
    }
  }

  const isBye = checkIsBye(player.name);
  const displayName = getPlayerDisplayName(player);

  return (
    <div
      onClick={onClick}
      className={`flex h-1/2 items-center justify-between border-t border-line px-3 text-[13px] transition-colors first:border-t-0 ${
        onClick ? 'cursor-pointer hover:bg-overlay' : ''
      } ${
        isWinner
          ? '-ml-1 border-l-[3px] border-l-accent bg-overlay pl-[13px]'
          : ''
      }`}
    >
      <div className="flex flex-1 items-baseline gap-2.5 overflow-hidden">
        {player.seed ? (
          <span className="shrink-0 pt-1 font-mono text-xs font-bold text-ink">
            {player.seed}
          </span>
        ) : null}
        <span
          title={displayName}
          className={`truncate text-sm ${isBye ? 'font-medium text-win' : ''} ${
            isWinner ? 'font-bold text-ink' : ''
          }`}
        >
          {displayName}
        </span>
      </div>
      {scoresHtml}
    </div>
  );
}