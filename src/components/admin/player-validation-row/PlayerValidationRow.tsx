'use client';

import { PairPickerModal } from '../PairPickerModal';
import { PlayerActionsToolbar } from './PlayerActionsToolbar';
import { PlayerIdentity } from './PlayerIdentity';
import type { PlayerValidationRowProps } from './PlayerValidationRow.types';
import { usePlayerValidationRow } from './usePlayerValidationRow';

export function PlayerValidationRow({
  player,
  index,
  allPlayers,
  onSeedChange,
  onResetSeed,
  onAssignToMode,
  onDeletePlayer,
  onPair,
  onUnpair,
}: PlayerValidationRowProps) {
  const {
    assignedMode,
    candidates,
    pairOpen,
    showPairControls,
    openPair,
    closePair,
    handlePairConfirm,
    handleUnpair,
    handleSelectMode,
  } = usePlayerValidationRow({
    player,
    allPlayers,
    onAssignToMode,
    onPair,
    onUnpair,
  });

  return (
    <>
      <div className="overflow-hidden rounded-2xl border-2 border-accent/10 bg-accent/1 transition hover:border-accent/50 hover:shadow-lg shadow-accent/10">
 
        <PlayerIdentity player={player} index={index} />

        <PlayerActionsToolbar
          player={player}
          index={index}
          assignedMode={assignedMode}
          onSeedChange={onSeedChange}
          onResetSeed={onResetSeed}
          onSelectMode={handleSelectMode}
          onDelete={() => {
            if (player.id) onDeletePlayer?.(player.id);
          }}
          onUnpair={handleUnpair}
          onOpenPair={openPair}
          showPairControls={showPairControls}
        />
      </div>

      <PairPickerModal
        open={pairOpen}
        player={player}
        candidates={candidates}
        onCancel={closePair}
        onConfirm={handlePairConfirm}
      />
    </>
  );
}