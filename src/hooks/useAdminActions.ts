'use client';

import { useRouter } from 'next/navigation';
import type { Player, TournamentMode } from '../types/tournament';
import type { Mode, RegistrationStatus } from '../lib/types';

type SavePlayers = (value: string) => { ok: boolean };
type UpdatePlayerStatus = (id: string, status: RegistrationStatus) => void | Promise<void>;
type UpdateRegistrationSeed = (id: string, seed: number | null) => void | Promise<void>;
type AssignPlayerToMode = (id: string, mode: Mode) => void | Promise<void>;
type DeleteRegistration = (id: string) => void | Promise<void>;
type PairPlayers = (id: string, partnerId: string) => void | Promise<void>;
type UnpairPlayer = (id: string) => void | Promise<void>;

type UseAdminActionsOptions = {
  mode: TournamentMode;
  players: Player[];
  isDrawing: boolean;
  hasExistingDraw: boolean;
  savePlayers: SavePlayers;
  updatePlayerStatus: UpdatePlayerStatus;
  updateRegistrationSeed: UpdateRegistrationSeed;
  assignPlayerToMode: AssignPlayerToMode;
  deleteRegistration: DeleteRegistration;
  pairPlayers: PairPlayers;
  unpairPlayer: UnpairPlayer;
  resetDraw: () => void;
  onPlayersSaved?: () => void;
};

export function useAdminActions({
  mode,
  isDrawing,
  hasExistingDraw,
  savePlayers,
  updatePlayerStatus,
  updateRegistrationSeed,
  assignPlayerToMode,
  deleteRegistration,
  pairPlayers,
  unpairPlayer,
  resetDraw,
  onPlayersSaved,
}: UseAdminActionsOptions) {
  const router = useRouter();

  const handleDrawToggle = () => {
    if (isDrawing) return;

    if (hasExistingDraw) {
      if (!confirm('⚠️ გაფრთხილება!\n\nნამდვილად გსურთ მონაცემების სრულად განულება?')) {
        return;
      }

      resetDraw();
    } else {
      router.push(`/?generateDraw=${mode}`);
    }
  };

  const handlePlayersSave = (value: string) => {
    if (hasExistingDraw) {
      if (
        !confirm(
          '⚠️ ყურადღება!\n\nსიის შეცვლა სრულად წაშლის მიმდინარე ბადეს და ანგარიშებს.\n\nნამდვილად გსურთ გაგრძელება?',
        )
      ) {
        return { ok: false };
      }
    }

    const res = savePlayers(value);

    if (res.ok) {
      onPlayersSaved?.();
    }

    return res;
  };

  const handleSeedChange = (
    playerId: string | undefined,
    _index: number,
    newSeed: number | null,
  ) => {
    if (!playerId) return;
    void updateRegistrationSeed(playerId, newSeed);
  };

  const handleResetSeed = (playerId: string | undefined, index: number) => {
    handleSeedChange(playerId, index, null);
  };

  const handleStatusChange = (id: string, status: RegistrationStatus) => {
    void updatePlayerStatus(id, status);
  };

  const handleAssignToMode = (id: string, assignMode: Mode) => {
    void assignPlayerToMode(id, assignMode);
  };

  const handleDeletePlayer = (id: string) => {
    void deleteRegistration(id);
  };

  const handlePairPlayers = (id: string, partnerId: string) => {
    void pairPlayers(id, partnerId);
  };

  const handleUnpairPlayer = (id: string) => {
    void unpairPlayer(id);
  };

  return {
    handleDrawToggle,
    handlePlayersSave,
    handleSeedChange,
    handleResetSeed,
    handleStatusChange,
    handleAssignToMode,
    handleDeletePlayer,
    handlePairPlayers,
    handleUnpairPlayer,
  };
}