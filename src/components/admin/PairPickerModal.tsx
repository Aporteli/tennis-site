'use client';

import { useState } from 'react';
import { X, Users, Check } from 'lucide-react';
import type { Player } from '../../lib/types';

type PairPickerModalProps = {
  open: boolean;
  player: Player | null;
  candidates: Player[];
  onCancel: () => void;
  onConfirm: (partnerId: string) => void;
};

export function PairPickerModal({
  open,
  player,
  candidates,
  onCancel,
  onConfirm,
}: PairPickerModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!open || !player) return null;

  const handleConfirm = () => {
    if (!selectedId) return;
    onConfirm(selectedId);
    setSelectedId(null);
  };

  const handleClose = () => {
    setSelectedId(null);
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-ink-3 hover:text-ink hover:bg-overlay transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-line p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-ink">წყვილის არჩევა</h3>
              <p className="text-xs text-ink-2 mt-0.5">
                {player.name} — აირჩიეთ პარტნიორი
              </p>
            </div>
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-4">
          {candidates.length === 0 ? (
            <div className="py-8 text-center text-sm text-ink-2">
              თავისუფალი მოთამაშეები არ მოიძებნა.
              <br />
              <span className="text-xs">
                (საჭიროა დამტკიცებული წყვილების მოთამაშეები, რომლებსაც პარტნიორი არ ჰყავთ)
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {candidates.map((c) => {
                const isSelected = selectedId === c.id;
                return (
                  <button
                    key={c.id ?? c.name}
                    type="button"
                    onClick={() => setSelectedId(c.id ?? null)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-accent bg-accent/10'
                        : 'border-line bg-card hover:bg-overlay'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{c.name}</p>
                      {c.seed != null && (
                        <p className="text-[11px] text-accent font-semibold">
                          Seed #{c.seed}
                        </p>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-accent" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-line p-4">
          <p className="mb-3 text-[11px] leading-relaxed text-ink-3">
            ⚠️ თუ არჩეული მოთამაშე უკვე წყვილშია, წინა წყვილი ავტომატურად დაიშლება.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-ink-2 hover:bg-overlay transition cursor-pointer"
            >
              გაუქმება
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedId}
              className="rounded-xl bg-accent px-5 py-2 text-xs font-bold text-inverse transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              დაწყვილება
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}