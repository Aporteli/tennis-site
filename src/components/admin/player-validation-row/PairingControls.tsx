'use client';

import { UserMinus, UserPlus } from 'lucide-react';

type PairingControlsProps = {
  hasPartner: boolean;
  onUnpair: () => void;
  onOpenPair: () => void;
};

export function PairingControls({
  hasPartner,
  onUnpair,
  onOpenPair,
}: PairingControlsProps) {
  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
      {hasPartner ? (
        <button
          type="button"
          onClick={onUnpair}
          className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          <UserMinus className="h-3.5 w-3.5" />
          დაშლა
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenPair}
          className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
        >
          <UserPlus className="h-3.5 w-3.5" />
          დაწყვილება
        </button>
      )}
    </div>
  );
}