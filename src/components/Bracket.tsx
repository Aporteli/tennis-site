'use client';

import { Match } from './Match';
import { roundLabel } from '../lib/tournament/helpers';
import type { BracketData, MatchDetails, Mode } from '../lib/types';

interface Props {
  bracketData: BracketData;
  matchDetails: MatchDetails;
  mode: Mode;
  onMatchClick: (round: number, matchIdx: number, playerIndex: 0 | 1) => void;
}

export function Bracket({ bracketData, matchDetails, mode, onMatchClick }: Props) {
  if (!bracketData.length || !bracketData[0]) return null;

  const currentSize = bracketData[0].length;
  const numRounds = Math.log2(currentSize);

  const MATCH_H = mode === 'doubles' ? 76 : 68;
  const SLOT1 = mode === 'doubles' ? 88 : 80;

  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex items-start" style={{ gap: 'var(--col-gap)' }}>
        {Array.from({ length: numRounds }).map((_, r) => {
          const matchesInRound = currentSize / Math.pow(2, r + 1);
          const slotSize = SLOT1 * Math.pow(2, r);
          const colHeight = matchesInRound * slotSize;

          return (
            <div key={r} className="flex shrink-0 flex-col" style={{ width: 'var(--card-w)' }}>
              <div className="border-b-2 border-line pb-3 text-center font-display text-sm font-bold uppercase tracking-wider text-ink-2">
                {roundLabel(currentSize / Math.pow(2, r))}
              </div>
              <div className="relative mt-6" style={{ height: `${colHeight}px` }}>
                {Array.from({ length: matchesInRound }).map((_, i) => {
                  const top = slotSize * i + (slotSize - MATCH_H) / 2;
                  const p1 = bracketData[r]?.[i * 2] ?? null;
                  const p2 = bracketData[r]?.[i * 2 + 1] ?? null;
                  const details = matchDetails[r]?.[i] ?? null;

                  return (
                    <Match
                      key={i}
                      p1={p1}
                      p2={p2}
                      details={details}
                      round={r}
                      matchIdx={i}
                      top={top}
                      height={MATCH_H}
                      onClick={onMatchClick}
                    />
                  );
                })}

                {r < numRounds - 1 &&
                  Array.from({ length: matchesInRound / 2 }).map((_, j) => {
                    const connTop = slotSize * (2 * j + 0.5);
                    return (
                      <div
                        key={`conn-${j}`}
                        className="absolute w-0.5 bg-line-2"
                        style={{
                          top: `${connTop}px`,
                          height: `${slotSize}px`,
                          left: `calc(var(--card-w) + var(--col-gap) / 2)`,
                        }}
                      />
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
