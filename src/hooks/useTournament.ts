'use client';

import { useCallback, useMemo } from 'react';
import { computeStats } from '../lib/tournament/bracket';
import { uniqueDrawEntries } from '../lib/drawPool';
import { useTournamentState } from './useTournamentState';
import { useRemoteSync } from './useRemoteSync';
import { useUndoHistory } from './useUndoHistory';
import { useDrawGeneration } from './useDrawGeneration';
import { usePlayerActions } from './usePlayerActions';
import { useMatchActions } from './useMatchActions';
import type { Mode } from '../lib/types';

export function useTournament() {
  const {
    mode,
    setMode,
    players,
    setPlayers,
    registrations,
    setRegistrations,
    bracketData,
    setBracketData,
    matchDetails,
    setMatchDetails,
    isDrawing,
    setIsDrawing,
    drawingRef,
    modeRef,
    playersRef,
  } = useTournamentState();

  const approvedForMode = useMemo(() => {
    const raw = registrations.filter((p) => {
      if (p.status !== 'APPROVED') return false;
      if (mode === 'doubles') {
        return (p.assignedMode ?? p.mode) === 'doubles' || Boolean(p.partner);
      }
      return (p.assignedMode ?? p.mode) !== 'doubles' && !p.partner;
    });
    return uniqueDrawEntries(raw, mode);
  }, [registrations, mode]);

  const hasExistingDraw = useMemo(() => {
    if (!bracketData[0]) return false;
    const placed = bracketData[0].filter((p) => p !== null).length;
    const seeds = players.filter((p) => p.seed && p.name).length;
    return placed > seeds;
  }, [bracketData, players]);
  const stats = useMemo(() => {
    const pool = hasExistingDraw ? uniqueDrawEntries(players, mode) : approvedForMode;
    return computeStats(pool);
  }, [hasExistingDraw, players, approvedForMode, mode]);

  const { remote, persist, mutate, mutateAll } = useRemoteSync({
    mode,
    modeRef,
    drawingRef,
    setPlayers,
    setBracketData,
    setMatchDetails,
    setRegistrations,
  });

  const { undoStack, setUndoStack, pushHistory, undo } = useUndoHistory({
    bracketData,
    matchDetails,
    players,
    isDrawing,
    persist,
    setBracketData,
    setMatchDetails,
    setPlayers,
  });

  const switchMode = useCallback(
    (next: Mode) => {
      if (next === modeRef.current || isDrawing) return;
      setMode(next);
      setUndoStack([]);
    },
    [isDrawing, modeRef, setMode, setUndoStack],
  );

  const { generateDraw, resetDraw } = useDrawGeneration({
    remote,
    mode,
    players,
    playersRef,
    approvedForMode,
    drawingRef,
    setMode,
    setIsDrawing,
    setUndoStack,
    setBracketData,
    setMatchDetails,
    persist,
    pushHistory,
  });

  const {
    savePlayers,
    updatePlayerStatus,
    updateRegistrationSeed,
    assignPlayerToMode,
    deleteRegistration,
    pairPlayers,
    unpairPlayer,
  } = usePlayerActions({
    modeRef,
    persist,
    mutate,
    mutateAll,
    pushHistory,
    setPlayers,
    setRegistrations,
    setBracketData,
    setMatchDetails,
  });

  const { saveScore, confirmWalkover } = useMatchActions({
    bracketData,
    matchDetails,
    players,
    persist,
    pushHistory,
    setBracketData,
    setMatchDetails,
  });

  return {
    mode,
    switchMode,
    players,
    registrations,
    bracketData,
    matchDetails,
    stats,
    isDrawing,
    hasExistingDraw,
    undoStack,
    undo,
    savePlayers,
    updatePlayerStatus,
    updateRegistrationSeed,
    assignPlayerToMode,
    deleteRegistration,
    pairPlayers,
    unpairPlayer,
    resetDraw,
    generateDraw,
    saveScore,
    confirmWalkover,
  };
}
