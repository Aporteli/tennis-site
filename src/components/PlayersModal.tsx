'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import type { Mode } from '../lib/types';

interface Props {
  open: boolean;
  mode: Mode;
  initialValue: string;
  onCancel: () => void;
  onSave: (value: string) => { ok: boolean; error?: string };
}

export function PlayersModal({ open, mode, initialValue, onCancel, onSave }: Props) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setError(null);
    }
  }, [open, initialValue]);

  const handleSave = () => {
    const res = onSave(value);
    if (!res.ok) setError(res.error ?? 'შეცდომა');
  };

  return (
    <Modal open={open} maxWidth={500}>
      <div className="relative pt-2">
        {/* დახურვის ღილაკი ზედა მარჯვენა კუთხეში */}
        <button
          type="button"
          className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full text-xl text-ink-2 transition hover:bg-line/40 hover:text-ink focus:outline-none cursor-pointer"
          aria-label="Close"
          onClick={onCancel}
        >
          ✕
        </button>

        <h3 className="mb-2 text-center text-xl font-bold">
          {mode === 'doubles' ? 'წყვილების სია' : 'მოთამაშეების სია'}
        </h3>
      </div>

      <p className="mb-4 text-[13px] leading-relaxed text-ink-2">
        {mode === 'doubles' ? (
          <>
            შეიყვანეთ თითო წყვილი თითო ხაზზე (მაგ:{' '}
            <strong>Giorgi Kalmakhelidze / Nika Beridze</strong>).
            <br />
            განთესილებისთვის (Seed) წინ დაუწერეთ ნომერი და წერტილი (მაგ:{' '}
            <strong>1. Giorgi Kalmakhelidze / Nika Beridze</strong>).
          </>
        ) : (
          <>
            შეიყვანეთ თითო მოთამაშე თითო ხაზზე.
            <br />
            განთესილებისთვის (Seed) წინ დაუწერეთ ნომერი და წერტილი (მაგ: <strong>1. Kalmakhelidze Z.</strong>).
          </>
        )}
      </p>

      <textarea
        rows={12}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full resize-y rounded-md border border-line bg-app p-3 font-body text-sm text-ink outline-none focus:border-accent-2 focus:ring-2 focus:ring-accent-2/20"
      />

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </Modal>
  );
}