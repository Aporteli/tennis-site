import type { Player, Slot } from '../types';
import { checkIsBye, nextPow2 } from './helpers';
import { placeByes } from './placeByes';
import { shuffleInPlace } from './shuffle';

export function seedOrder(size: number): number[] {
  if (size <= 1) return [1];
  let order = [1, 2];
  while (order.length < size) {
    const newSize = order.length * 2;
    const next: number[] = [];
    for (let i = 0; i < order.length; i++) {
      const val = order[i];
      if (i % 2 === 0) next.push(val, newSize + 1 - val);
      else next.push(newSize + 1 - val, val);
    }
    order = next;
  }
  return order;
}

function partitionPlayers(active: Player[], size: number) {
  const seenSeeds = new Set<number>();
  const seeded: Player[] = [];
  const unseeded: Player[] = [];
  for (const p of active) {
    const seed = p.seed;
    if (seed && seed <= size && !seenSeeds.has(seed)) {
      seenSeeds.add(seed);
      seeded.push(p);
    } else {
      unseeded.push(p);
    }
  }
  seeded.sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0));
  return { seeded, unseeded };
}

export function buildSlots(playersList: Player[]): Slot[] {
  const active = playersList.filter((p) => p && !checkIsBye(p.name));
  const size = nextPow2(active.length || 1);
  const { seeded, unseeded } = partitionPlayers(active, size);
  const order = seedOrder(size);
  const slots: (Slot | 'BYE_SLOT')[] = new Array(size).fill(null);
  const placedSeeds: Player[] = [];

  for (const p of seeded) {
    const idx = order.indexOf(p.seed!);
    if (idx === -1 || slots[idx] !== null) {
      unseeded.push(p);
      continue;
    }
    slots[idx] = { ...p, bye: false };
    placedSeeds.push(p);
  }

  placeByes(slots, placedSeeds, order, size - active.length);
  shuffleInPlace(unseeded);

  let u = 0;
  for (let i = 0; i < size; i++) {
    if (slots[i] === null && u < unseeded.length) {
      slots[i] = { ...unseeded[u], bye: false };
      u++;
    }
  }

  return slots.map((s) => (s === 'BYE_SLOT' ? { name: 'Bye', bye: true } : s));
}
