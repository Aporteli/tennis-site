'use client';

import { RefreshCw } from 'lucide-react';
import { SeedSelector } from '../SeedSelector';
import type { Player } from '../../../lib/types';
import type { PlayerValidationRowProps } from './PlayerValidationRow.types';

type SeedControlsProps = {
  player: Player;
  index: number;
  onSeedChange: PlayerValidationRowProps['onSeedChange'];
  onResetSeed: PlayerValidationRowProps['onResetSeed'];
};

export function SeedControls({
  player,
  index,
  onSeedChange,
  onResetSeed,
}: SeedControlsProps) {
  const key = player.id ?? player.name;

  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
      <SeedSelector
        value={player.seed ?? ''}
        onChange={(value) =>
          onSeedChange(key, index, value ? Number(value) : null)
        }
      />

      {player.seed && (
        <button
          type="button"
          onClick={() => onResetSeed(key, index)}
          title="განთესვის გასუფთავება"
          className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}