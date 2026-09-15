'use client';

import { AlertTriangle } from 'lucide-react';

type ConfirmDeleteModalProps = {
  open: boolean;
  playerName: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({
  open,
  playerName,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl border border-slate-200">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600/10 text-rose-600 shadow-sm border border-rose-100">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-indigo-700 tracking-tight">წაშლის დადასტურება</h3>
            <p className="mt-2 text-base text-slate-700">
              დარწმუნებული ხართ, რომ გსურთ მოთამაშის{' '}
              <span className="font-semibold text-indigo-900">{playerName}</span> წაშლა?
            </p>
            <p className="mt-2 text-sm text-rose-600 font-medium">ეს მოქმედება შეუქცევადია.</p>
          </div>
          <div className="flex w-full gap-3 mt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-indigo-200 bg-indigo-50/70 px-4 py-2 text-base font-medium text-indigo-700 hover:bg-indigo-100 transition"
            >
              გაუქმება
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-base font-bold text-white transition hover:bg-rose-500 shadow"
            >
              წაშლა
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}