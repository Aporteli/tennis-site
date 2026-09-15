'use client';

import type { Mode } from '../lib/types';

interface Props {
  mode: Mode;
  onModeChange: (m: Mode) => void;
}

export function Controls({ mode, onModeChange }: Props) {
  return (
    <div className="mb-8 flex w-full flex-wrap gap-4">
      <div className="flex min-w-[320px] flex-1 gap-1 rounded-[10px] border border-overlay bg-panel p-1">
        <button
          onClick={() => onModeChange('singles')}
          className={`flex-1 rounded-md px-4 py-3 text-base font-medium transition ${
            mode === 'singles'
              ? 'bg-card-hover font-semibold text-accent shadow'
              : 'text-ink-2 hover:bg-overlay hover:text-ink'
          }`}
        >
          ერთეულები
        </button>
        <button
          onClick={() => onModeChange('doubles')}
          className={`flex-1 rounded-md px-4 py-3 text-base font-medium transition ${
            mode === 'doubles'
              ? 'bg-card-hover font-semibold text-accent shadow'
              : 'text-ink-2 hover:bg-overlay hover:text-ink'
          }`}
        >
          წყვილები
        </button>
      </div>
    </div>
  );
}
