import type { Mode, Player } from '../../../lib/types';

export type PlayerValidationRowProps = {
  player: Player;
  index: number;
  allPlayers: Player[];
  onSeedChange: (
    playerName: string | undefined,
    index: number,
    newSeed: number | null,
  ) => void;
  onResetSeed: (playerName: string | undefined, index: number) => void;
  onAssignToMode?: (id: string, mode: Mode) => void;
  onDeletePlayer?: (id: string) => void;
  onPair?: (id: string, partnerId: string) => void;
  onUnpair?: (id: string) => void;
};