import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { advanceFirstRoundByes } from '../lib/tournament/advanceByes';
import type { BracketData, MatchDetails, Player, Slot } from '../lib/types';

interface Args {
  bd: BracketData;
  md: MatchDetails;
  slots: Slot[];
  size: number;
  currentPlayers: Player[];
  persist: (
    bd: BracketData,
    md: MatchDetails,
    pl: Player[],
    opts?: { revalidate?: boolean },
  ) => Promise<void>;
  drawingRef: MutableRefObject<boolean>;
  drawIntervalRef: MutableRefObject<ReturnType<typeof setInterval> | null>;
  setIsDrawing: Dispatch<SetStateAction<boolean>>;
  setBracketData: Dispatch<SetStateAction<BracketData>>;
  setMatchDetails: Dispatch<SetStateAction<MatchDetails>>;
  writeChain: Promise<void>;
}

function clearGenerateDrawParam() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('generateDraw')) return;
  url.searchParams.delete('generateDraw');
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
}

export function runDrawAnimation({
  bd,
  md,
  slots,
  size,
  currentPlayers,
  persist,
  drawingRef,
  drawIntervalRef,
  setIsDrawing,
  setBracketData,
  setMatchDetails,
  writeChain,
}: Args): ReturnType<typeof setInterval> {
  const steps: { index: number; player: Player }[] = [];
  for (let i = 0; i < size; i++) {
    const slot = slots[i];
    if (slot && !slot.seed) steps.push({ index: i, player: slot });
  }

  let chain = writeChain;
  let stepIdx = 0;
  let intervalId: ReturnType<typeof setInterval>;

  intervalId = setInterval(() => {
    if (stepIdx >= steps.length) {
      clearInterval(intervalId);
      drawIntervalRef.current = null;
      advanceFirstRoundByes(bd, md, size);
      setBracketData(bd.map((r) => [...r]));
      setMatchDetails(md.map((r) => [...r]));
      const snapshotBd = bd.map((r) => [...r]);
      const snapshotMd = md.map((r) => [...r]);
      void chain
        .then(() => persist(snapshotBd, snapshotMd, currentPlayers))
        .finally(() => {
          drawingRef.current = false;
          setIsDrawing(false);
        });
      clearGenerateDrawParam();
      return;
    }

    const step = steps[stepIdx];
    bd[0][step.index] = step.player;
    setBracketData(bd.map((r) => [...r]));
    const snapshotBd = bd.map((r) => [...r]);
    const snapshotMd = md.map((r) => [...r]);
    chain = chain.then(() =>
      persist(snapshotBd, snapshotMd, currentPlayers, { revalidate: false }),
    );
    stepIdx++;
  }, 1000);

  return intervalId;
}
