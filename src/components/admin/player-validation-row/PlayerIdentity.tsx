'use client';

import { Phone } from 'lucide-react';
import type { Player } from '../../../lib/types';
import { PartnerBadge } from './PartnerBadge';
import { SeedBadge } from './SeedBadge';
import { UnseededLabel } from './UnseededLabel';

export function PlayerIdentity({
  player,
  index,
}: {
  player: Player;
  index: number;
}) {
  return (
    <div className="px-3 pb-3 pt-3 sm:px-4 sm:pt-4">
      <div className="flex items-start gap-3">
        {/* Player number badge */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600 ring-1 ring-indigo-500/20">
          #{index + 1}
        </div>

        <div className="min-w-0 flex-1">
          {/* Name + seed + mode */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold leading-tight text-ink">
              {player.name}
            </span>

            {player.seed ? (
              <SeedBadge seed={player.seed} />
            ) : (
              <UnseededLabel />
            )}

            {player.mode && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  player.mode === 'doubles'
                    ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/20'
                    : 'bg-slate-100 text-slate-500 ring-1 ring-slate-300/40'
                }`}>
                {player.mode === 'doubles' ? 'Doubles' : 'Singles'}
              </span>
            )}
          </div>

          {/* Phone */}
          {player.phone && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-2">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{player.phone}</span>
            </div>
          )}

          {/* Partner inset */}
          <PartnerBadge player={player} />
        </div>
      </div>
    </div>
  );
}
