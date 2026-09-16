'use client';

import { useCallback, useEffect } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { fetcher, putTournament } from '../lib/api';
import { buildInitialBracket } from '../lib/drawInit';
import { playerBelongsToMode } from '../lib/players';
import { checkIsBye } from '../lib/tournament/helpers';
import type { BracketData, MatchDetails, Mode, Player, TournamentState } from '../lib/types';

interface Params {
  mode: Mode;
  modeRef: MutableRefObject<Mode>;
  drawingRef: MutableRefObject<boolean>;
  setPlayers: Dispatch<SetStateAction<Player[]>>;
  setBracketData: Dispatch<SetStateAction<BracketData>>;
  setMatchDetails: Dispatch<SetStateAction<MatchDetails>>;
  setRegistrations: Dispatch<SetStateAction<Player[]>>;
}

const swrOptions = {
  refreshInterval: 1000,
  revalidateOnFocus: true,
};

export function useRemoteSync({
  mode,
  modeRef,
  drawingRef,
  setPlayers,
  setBracketData,
  setMatchDetails,
  setRegistrations,
}: Params) {
  const singles = useSWR<TournamentState>('/api/tournament?mode=singles', fetcher, swrOptions);
  const doubles = useSWR<TournamentState>('/api/tournament?mode=doubles', fetcher, swrOptions);

  const remote = mode === 'doubles' ? doubles.data : singles.data;
  const mutate = mode === 'doubles' ? doubles.mutate : singles.mutate;

  const mutateAll = useCallback(async () => {
    await globalMutate((key) => typeof key === 'string' && key.startsWith('/api/tournament'), undefined, {
      revalidate: true,
    });
  }, []);

  const persist = useCallback(
    async (bd: BracketData, md: MatchDetails, pl: Player[], opts?: { revalidate?: boolean }) => {
      const currentMode = modeRef.current;
      const playersList = pl
        .filter((p) => p && !checkIsBye(p.name) && !p.bye && playerBelongsToMode(p, currentMode))
        .map((p) => ({ ...p, mode: p.mode ?? currentMode }));

      await putTournament({
        mode: currentMode,
        bracketData: bd,
        matchDetails: md,
        playersList,
      });
      if (opts?.revalidate !== false) {
        await mutateAll();
      }
    },
    [mutateAll, modeRef],
  );

  useEffect(() => {
    if (drawingRef.current) return;

    if (!remote) {
      return;
    }

    const list = remote.playersList ?? [];
    setPlayers(list);
    setRegistrations(remote.registrations ?? []);

    if (list.length === 0) {
      setBracketData([]);
      setMatchDetails([]);
      return;
    }

    if (remote.bracketData && remote.bracketData.length > 0) {
      setBracketData(remote.bracketData);
      setMatchDetails(remote.matchDetails ?? []);
      return;
    }

    setBracketData([]);
    setMatchDetails([]);
  }, [remote, mode, drawingRef, setPlayers, setBracketData, setMatchDetails, setRegistrations]);

  return { remote, mutate, mutateAll, persist };
}
