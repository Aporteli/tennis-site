'use client';

import { Check } from 'lucide-react';
import type { Mode } from '../../../lib/types';

type ModeSwitcherProps = {
  assignedMode?: Mode;
  onSelect: (mode: Mode) => void;
};

export function ModeSwitcher({
  assignedMode,
  onSelect,
}: ModeSwitcherProps) {
  const isSingles = assignedMode === 'singles';
  const isDoubles = assignedMode === 'doubles';

  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100/60 p-0.5">
      <button
        type="button"
        aria-pressed={isSingles}
        onClick={() => onSelect('singles')}
        className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition ${
          isSingles
            ? 'bg-white text-indigo-600 shadow-xs font-semibold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {isSingles && <Check className="h-3.5 w-3.5" />}
        ერთეულები
      </button>

      <button
        type="button"
        aria-pressed={isDoubles}
        onClick={() => onSelect('doubles')}
        className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition ${
          isDoubles
            ? 'bg-white text-indigo-600 shadow-xs font-semibold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {isDoubles && <Check className="h-3.5 w-3.5" />}
        წყვილები
      </button>
    </div>
  );
}