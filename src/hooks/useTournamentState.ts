'use client';

import { useRef, useState } from 'react';
import { useSyncedRef } from './useSyncedRef';
import type { BracketData, MatchDetails, Mode, Player } from '../lib/types';

export function useTournamentState() {
  const [mode, setMode] = useState<Mode>('singles');
  const [players, setPlayers] = useState<Player[]>([]);
  const [registrations, setRegistrations] = useState<Player[]>([]);
  const [bracketData, setBracketData] = useState<BracketData>([]);
  const [matchDetails, setMatchDetails] = useState<MatchDetails>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const drawingRef = useRef(false);
  const modeRef = useSyncedRef(mode);
  const playersRef = useSyncedRef(players);

  return {
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
  };
}