'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { checkIsBye } from '../lib/tournament/helpers';
import { buildInitialBracket } from '../lib/drawInit';
import { playerBelongsToMode } from '../lib/players';
import type { BracketData, MatchDetails, Mode, Player, TournamentState } from '../lib/types';

interface Params {
  remote: TournamentState | undefined;
  mode: Mode;
  players: Player[];
  playersRef: MutableRefObject<Player[]>;
  drawingRef: MutableRefObject<boolean>;
  setMode: Dispatch<SetStateAction<Mode>>;
  setIsDrawing: Dispatch<SetStateAction<boolean>>;
  setUndoStack: Dispatch<SetStateAction<string[]>>;
  setBracketData: Dispatch<SetStateAction<BracketData>>;
  setMatchDetails: Dispatch<SetStateAction<MatchDetails>>;
  persist: (
    bd: BracketData,
    md: MatchDetails,
    pl: Player[],
    opts?: { revalidate?: boolean },
  ) => Promise<void>;  pushHistory: () => void;
}

export function useDrawGeneration({
  remote,
  mode,
  players,
  playersRef,
  drawingRef,
  setMode,
  setIsDrawing,
  setUndoStack,
  setBracketData,
  setMatchDetails,
  persist,
  pushHistory,
}: Params) {
  const drawIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (drawIntervalRef.current) clearInterval(drawIntervalRef.current);
    };
  }, []);

  // ── Reset draw ──────────────────────────────────────────────────────
  const resetDraw = useCallback(() => {
    pushHistory();

    const currentPlayers = players.filter((p) => p && !checkIsBye(p.name) && !p.bye && playerBelongsToMode(p, mode));
    const { bracketData, matchDetails } = buildInitialBracket(currentPlayers);
    setBracketData(bracketData);
    setMatchDetails(matchDetails);
    persist(bracketData, matchDetails, currentPlayers);
  }, [mode, players, persist, pushHistory, setBracketData, setMatchDetails]);

  // ── Draw generation ─────────────────────────────────────────────────
  const generateDraw = useCallback(() => {
    if (drawingRef.current) return;

    const currentPlayers = playersRef.current.filter(
      (p) => p && !checkIsBye(p.name) && !p.bye && playerBelongsToMode(p, mode),
    );
    if (currentPlayers.length < 2) return;

    pushHistory();
    drawingRef.current = true;
    setIsDrawing(true);

    const { bracketData: bd, matchDetails: md, stats: s, slots } = buildInitialBracket(currentPlayers);

    setBracketData(bd.map((r) => [...r]));
    setMatchDetails(md.map((r) => [...r]));
    persist(bd, md, currentPlayers);

    const steps: { index: number; player: Player }[] = [];
    for (let i = 0; i < s.size; i++) {
      const slot = slots[i];
      if (slot && !slot.seed) steps.push({ index: i, player: slot });
    }

    let stepIdx = 0;
    if (drawIntervalRef.current) clearInterval(drawIntervalRef.current);

    let writeChain: Promise<void> = Promise.resolve();
    const persistStep = () => {
      const snapshotBd = bd.map((r) => [...r]);
      const snapshotMd = md.map((r) => [...r]);
      writeChain = writeChain.then(() =>
        persist(snapshotBd, snapshotMd, currentPlayers, { revalidate: false }),
      );
    };

    const intervalId = setInterval(() => {
      if (stepIdx >= steps.length) {
        clearInterval(intervalId);
        drawIntervalRef.current = null;

        // Auto-advance byes into round 2
        for (let i = 0; i < s.size; i += 2) {
          const p1 = bd[0][i] ?? null;
          const p2 = bd[0][i + 1] ?? null;
          if (!bd[1]) bd[1] = new Array(s.size / 2).fill(null);
          if (!md[0]) md[0] = new Array(s.size / 2).fill(null);

          if (p1 && p2) {
            const p1Bye = checkIsBye(p1.name);
            const p2Bye = checkIsBye(p2.name);
            if (!p1Bye && p2Bye) {
              bd[1][i / 2] = { ...p1, bye: false };
              md[0][i / 2] = { isWalkover: true, winnerIndex: 0 };
            } else if (p1Bye && !p2Bye) {
              bd[1][i / 2] = { ...p2, bye: false };
              md[0][i / 2] = { isWalkover: true, winnerIndex: 1 };
            }
          }
        }

        setBracketData(bd.map((r) => [...r]));
        setMatchDetails(md.map((r) => [...r]));
        void persist(bd, md, currentPlayers).finally(() => {
          drawingRef.current = false;
          setIsDrawing(false);
        });

        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          if (url.searchParams.has('generateDraw')) {
            url.searchParams.delete('generateDraw');
            window.history.replaceState(null, '', `${url.pathname}${url.search}`);
          }
        }
        return;
      }

      const step = steps[stepIdx];
      bd[0][step.index] = step.player;
      setBracketData(bd.map((r) => [...r]));
      persistStep();
      stepIdx++;
    }, 1000);

    drawIntervalRef.current = intervalId;
  }, [mode, persist, pushHistory, playersRef, drawingRef, setIsDrawing, setBracketData, setMatchDetails]);

  // ── Auto-generate from ?generateDraw=... URL param ──────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !remote) return;

    const pending = new URLSearchParams(window.location.search).get('generateDraw');
    if (pending !== 'singles' && pending !== 'doubles') return;

    if (pending !== mode) {
      setMode(pending);
      setUndoStack([]);
      return;
    }

    if (drawingRef.current) return;

    const list = remote.playersList ?? [];
    if (list.length < 2) return;

    playersRef.current = list;
    const timeoutId = window.setTimeout(() => {
      generateDraw();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [remote, mode, generateDraw, setMode, setUndoStack, playersRef, drawingRef]);

  return { generateDraw, resetDraw };
}
