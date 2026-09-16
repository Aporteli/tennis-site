import type { Slot } from '../types';
import { shuffleInPlace } from './shuffle';

type SlotCell = Slot | 'BYE_SLOT';

function opponentIndex(idx: number): number {
  return idx % 2 === 0 ? idx + 1 : idx - 1;
}

/** Prefer a bye opposite each placed seed; leftover byes go in random empty pairs. */
export function placeByes(
  slots: SlotCell[],
  placedSeeds: { seed?: number | null }[],
  order: number[],
  byesToAssign: number,
): void {
  let remaining = byesToAssign;

  for (const p of placedSeeds) {
    if (remaining <= 0) break;
    if (!p.seed) continue;
    const idx = order.indexOf(p.seed);
    if (idx === -1) continue;
    const oppIdx = opponentIndex(idx);
    if (slots[oppIdx] !== null) continue;
    slots[oppIdx] = 'BYE_SLOT';
    remaining--;
  }

  if (remaining <= 0) return;

  const emptyPairs: number[] = [];
  for (let i = 0; i < slots.length; i += 2) {
    if (slots[i] === null && slots[i + 1] === null) emptyPairs.push(i);
  }
  shuffleInPlace(emptyPairs);

  const randomCount = Math.min(remaining, emptyPairs.length);
  for (let i = 0; i < randomCount; i++) {
    const start = emptyPairs[i];
    slots[start + (Math.random() < 0.5 ? 0 : 1)] = 'BYE_SLOT';
  }
  remaining -= randomCount;

  for (let i = 0; i < slots.length && remaining > 0; i++) {
    if (slots[i] === null) {
      slots[i] = 'BYE_SLOT';
      remaining--;
    }
  }
}
