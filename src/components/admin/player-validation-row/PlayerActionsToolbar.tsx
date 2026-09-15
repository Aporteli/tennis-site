'use client';

import type { Mode, Player } from '../../../lib/types';
import type { PlayerValidationRowProps } from './PlayerValidationRow.types';
import { DeletePlayerButton } from './DeletePlayerButton';
import { ModeSwitcher } from './ModeSwitcher';
import { PairingControls } from './PairingControls';
import { SeedControls } from './SeedControls';

type PlayerActionsToolbarProps = {
  player: Player;
  index: number;
  assignedMode?: Mode;
  onSeedChange: PlayerValidationRowProps['onSeedChange'];
  onResetSeed: PlayerValidationRowProps['onResetSeed'];
  onSelectMode: (mode: Mode) => void;
  onDelete: () => void;
  onUnpair: () => void;
  onOpenPair: () => void;
  showPairControls: boolean;
};

export function PlayerActionsToolbar({
  player,
  index,
  assignedMode,
  onSeedChange,
  onResetSeed,
  onSelectMode,
  onDelete,
  onUnpair,
  onOpenPair,
  showPairControls,
}: PlayerActionsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line/30 bg-overlay/20 px-3 py-2.5 sm:px-4">
      <SeedControls
        player={player}
        index={index}
        onSeedChange={onSeedChange}
        onResetSeed={onResetSeed}
      />

      {showPairControls && (
        <PairingControls
          hasPartner={Boolean(player.partner)}
          onUnpair={onUnpair}
          onOpenPair={onOpenPair}
        />
      )}

      <ModeSwitcher assignedMode={assignedMode} onSelect={onSelectMode} />

      <div className="ml-auto">
        <DeletePlayerButton playerName={player.name} onDelete={onDelete} />
      </div>
    </div>
  );
}
