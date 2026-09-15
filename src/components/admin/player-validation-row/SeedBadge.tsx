'use client';

import { Trophy } from 'lucide-react';

export function SeedBadge({ seed }: { seed: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20">
      <Trophy className="h-3 w-3 text-amber-500" />
      განთესვა #{seed}
    </span>
  );
}