'use client';

import { Trash2 } from 'lucide-react';

type DeletePlayerButtonProps = {
  playerName: string;
  onDelete?: () => void;
};

export function DeletePlayerButton({
  playerName,
  onDelete,
}: DeletePlayerButtonProps) {
  return (
    <button
      type="button"
      title="მოთამაშის წაშლა"
      aria-label={`Delete ${playerName}`}
      onClick={onDelete}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}