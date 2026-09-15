'use client';

import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { parsePlayersInput } from '../lib/tournament/helpers';
import { buildInitialBracket } from '../lib/drawInit';
import {
  assignPlayerToTournament,
  deletePlayer,
  pairPlayers,
  patchPlayerSeed,
  patchPlayerStatus,
  unpairPlayer,
} from '../lib/api';
import type { BracketData, MatchDetails, Mode, Player, RegistrationStatus } from '../lib/types';

interface Params {
  modeRef: MutableRefObject<Mode>;
  persist: (bd: BracketData, md: MatchDetails, pl: Player[]) => Promise<void>;
  mutate: () => Promise<unknown>;
  mutateAll: () => Promise<unknown>;
  pushHistory: () => void;
  setPlayers: Dispatch<SetStateAction<Player[]>>;
  setRegistrations: Dispatch<SetStateAction<Player[]>>;
  setBracketData: Dispatch<SetStateAction<BracketData>>;
  setMatchDetails: Dispatch<SetStateAction<MatchDetails>>;
}

export type SavePlayersResult = { ok: true } | { ok: false; error: string };

export function usePlayerActions({
  modeRef,
  persist,
  mutate: _mutate,
  mutateAll,
  pushHistory,
  setPlayers,
  setRegistrations,
  setBracketData,
  setMatchDetails,
}: Params) {
  const savePlayers = useCallback(
    (input: string): SavePlayersResult => {
      const lines = input
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        return { ok: false, error: 'მონაწილეთა სია ცარიელია!' };
      }

      pushHistory();

      const currentMode = modeRef.current;
      const newPlayers = parsePlayersInput(input).map((p) => ({
        ...p,
        mode: currentMode,
        status: 'APPROVED' as const,
      }));
      const { bracketData, matchDetails } = buildInitialBracket(newPlayers);

      setPlayers(newPlayers);
      setBracketData(bracketData);
      setMatchDetails(matchDetails);
      persist(bracketData, matchDetails, newPlayers);

      return { ok: true };
    },
    [modeRef, persist, pushHistory, setPlayers, setBracketData, setMatchDetails],
  );

  const updatePlayerStatus = useCallback(
    async (id: string, status: RegistrationStatus) => {
      setRegistrations((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
      await patchPlayerStatus(id, status);
      await mutateAll();
    },
    [setRegistrations, mutateAll],
  );

  const updateRegistrationSeed = useCallback(
    async (id: string, seed: number | null) => {
      setRegistrations((prev) => prev.map((p) => (p.id === id ? { ...p, seed } : p)));
      await patchPlayerSeed(id, seed);
      await mutateAll();
    },
    [setRegistrations, mutateAll],
  );

  const assignPlayerToMode = useCallback(
    async (id: string, assignMode: Mode) => {
      setRegistrations((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, mode: assignMode, assignedMode: assignMode } : p,
        ),
      );
      await assignPlayerToTournament(id, assignMode);
      await mutateAll();
    },
    [mutateAll, setRegistrations],
  );

  const deleteRegistration = useCallback(
    async (id: string) => {
      setRegistrations((prev) => prev.filter((p) => p.id !== id));
      await deletePlayer(id);
      await mutateAll();
    },
    [mutateAll, setRegistrations],
  );

  const pairPlayersAction = useCallback(
    async (id: string, partnerId: string) => {
      await pairPlayers(id, partnerId);
      await mutateAll();
    },
    [mutateAll],
  );

  const unpairPlayerAction = useCallback(
    async (id: string) => {
      await unpairPlayer(id);
      await mutateAll();
    },
    [mutateAll],
  );

  return {
    savePlayers,
    updatePlayerStatus,
    updateRegistrationSeed,
    assignPlayerToMode,
    deleteRegistration,
    pairPlayers: pairPlayersAction,
    unpairPlayer: unpairPlayerAction,
  };
}