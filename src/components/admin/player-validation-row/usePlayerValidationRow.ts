'use client';

import { useState } from 'react';
import type { Mode, Player } from '../../../lib/types';
import type { PlayerValidationRowProps } from './PlayerValidationRow.types';

type UsePlayerValidationRowParams = Pick<
  PlayerValidationRowProps,
  'player' | 'allPlayers' | 'onAssignToMode' | 'onPair' | 'onUnpair'
>;

export function usePlayerValidationRow({
  player,
  allPlayers,
  onAssignToMode,
  onPair,
  onUnpair,
}: UsePlayerValidationRowParams) {
  const [pickedMode, setPickedMode] = useState<Mode | undefined>();
  const [pairOpen, setPairOpen] = useState(false);

  const assignedMode = pickedMode ?? player.assignedMode;
  const showPairControls =
    player.mode === 'doubles' && player.status === 'APPROVED';

  const candidates = allPlayers.filter(
    (p) =>
      p.id &&
      p.id !== player.id &&
      p.mode === 'doubles' &&
      p.status === 'APPROVED' &&
      !p.partner,
  );

  const handlePairConfirm = (partnerId: string) => {
    if (!player.id || !onPair) return;
    onPair(player.id, partnerId);
    setPairOpen(false);
  };

  const handleUnpair = () => {
    if (!player.id || !onUnpair) return;
    onUnpair(player.id);
  };

  const handleSelectMode = (mode: Mode) => {
    if (!player.id) return;
    setPickedMode(mode);
    onAssignToMode?.(player.id, mode);
  };

  return {
    assignedMode,
    candidates,
    pairOpen,
    showPairControls,
    openPair: () => setPairOpen(true),
    closePair: () => setPairOpen(false),
    handlePairConfirm,
    handleUnpair,
    handleSelectMode,
  };
}