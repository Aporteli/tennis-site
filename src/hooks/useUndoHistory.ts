'use client';

import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { BracketData, MatchDetails, Player } from '../lib/types';

interface Snapshot {
  bracketData: BracketData;
  matchDetails: MatchDetails;
  playersList: Player[];
}

interface Params {
  bracketData: BracketData;
  matchDetails: MatchDetails;
  players: Player[];
  isDrawing: boolean;
  persist: (bd: BracketData, md: MatchDetails, pl: Player[]) => Promise<void>;
  setBracketData: Dispatch<SetStateAction<BracketData>>;
  setMatchDetails: Dispatch<SetStateAction<MatchDetails>>;
  setPlayers: Dispatch<SetStateAction<Player[]>>;
}

export function useUndoHistory({
  bracketData,
  matchDetails,
  players,
  isDrawing,
  persist,
  setBracketData,
  setMatchDetails,
  setPlayers,
}: Params) {
  const [undoStack, setUndoStack] = useState<string[]>([]);

  const pushHistory = useCallback(() => {
    const snap: Snapshot = {
      bracketData,
      matchDetails,
      playersList: players,
    };
    setUndoStack((s) => [...s, JSON.stringify(snap)]);
  }, [bracketData, matchDetails, players]);

  const undo = useCallback(() => {
    if (undoStack.length === 0 || isDrawing) return;

    const prev = JSON.parse(undoStack[undoStack.length - 1]) as Snapshot;
    setUndoStack((s) => s.slice(0, -1));

    setBracketData(prev.bracketData);
    setMatchDetails(prev.matchDetails);
    setPlayers(prev.playersList);

    persist(prev.bracketData, prev.matchDetails, prev.playersList);
  }, [
    undoStack,
    isDrawing,
    persist,
    setBracketData,
    setMatchDetails,
    setPlayers,
  ]);

  return { undoStack, setUndoStack, pushHistory, undo };
}