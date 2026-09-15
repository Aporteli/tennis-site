import type { Player, Slot } from '../types';
import { checkIsBye, nextPow2 } from './helpers';

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

export function buildSlots(playersList: Player[]): Slot[] {
  const activePlayers = playersList.filter((p) => p && !checkIsBye(p.name) && !p.bye);

  const currentSize = nextPow2(activePlayers.length || 1);
  const currentByeCount = currentSize - activePlayers.length;

  const seeded = activePlayers
    .filter((p) => p.seed && p.seed <= currentSize)
    .sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0));

  let unseeded = activePlayers.filter((p) => !p.seed || p.seed > currentSize);

  const order = seedOrder(currentSize);
  const slots: (Slot | 'BYE_SLOT')[] = new Array(currentSize).fill(null);

  seeded.forEach((p) => {
    const idx = order.indexOf(p.seed!);
    if (idx !== -1) slots[idx] = { ...p };
  });

  let byesToAssign = currentByeCount;

  for (let i = 0; i < seeded.length && byesToAssign > 0; i++) {
    const p = seeded[i];
    const idx = order.indexOf(p.seed!);
    const oppIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
    slots[oppIdx] = 'BYE_SLOT';
    byesToAssign--;
  }

  if (byesToAssign > 0) {
    const availablePairs: number[] = [];
    for (let i = 0; i < currentSize; i += 2) {
      if (slots[i] === null && slots[i + 1] === null) availablePairs.push(i);
    }
    for (let i = availablePairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePairs[i], availablePairs[j]] = [availablePairs[j], availablePairs[i]];
    }
    for (let i = 0; i < byesToAssign && i < availablePairs.length; i++) {
      const pairStart = availablePairs[i];
      const byePos = pairStart + (Math.random() < 0.5 ? 0 : 1);
      slots[byePos] = 'BYE_SLOT';
    }
  }

  slots.forEach((slot, idx) => {
    if (slot && slot !== 'BYE_SLOT') {
      const oppIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
      if (slots[oppIdx] === 'BYE_SLOT') (slot as Player).bye = true;
    }
  });

  for (let i = unseeded.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unseeded[i], unseeded[j]] = [unseeded[j], unseeded[i]];
  }

  let unseededIndex = 0;
  for (let i = 0; i < currentSize; i++) {
    if (slots[i] === null && unseededIndex < unseeded.length) {
      slots[i] = { ...unseeded[unseededIndex] };
      unseededIndex++;
    }
  }

  return slots.map((s) => (s === 'BYE_SLOT' ? { name: 'Bye', bye: true } : s));
}