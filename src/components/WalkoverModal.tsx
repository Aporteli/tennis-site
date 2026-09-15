'use client';

import Modal from './Modal';
import { getPlayerDisplayName } from '../lib/tournament/helpers';
import type { PendingWalkover } from '../lib/types';

interface Props {
  open: boolean;
  pending: PendingWalkover | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function WalkoverModal({ open, pending, onCancel, onConfirm }: Props) {
  return (
    <Modal open={open}>
      <h3 className="mb-4 text-center text-xl font-bold text-accent">
        Walkover (W/O)
      </h3>
      <p className="mb-5 text-center text-sm leading-relaxed text-ink-2">
        {pending ? (
          <>
            მოწინააღმდეგე ჯერ უცნობია (TBD).<br />
            <br />
            გსურთ{' '}
            <strong className="text-ink">
              {getPlayerDisplayName(pending.existingPlayer)}
            </strong>
            -ის შემდეგ რაუნდში ავტომატურად გადაყვანა?
          </>
        ) : null}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={onCancel}
          className="rounded-md px-5 py-3 text-sm font-semibold text-ink-2 hover:bg-overlay"
        >
          გაუქმება
        </button>
        <button
          onClick={onConfirm}
          className="rounded-md bg-danger px-5 py-3 text-sm font-semibold text-white hover:brightness-110"
        >
          დადასტურება
        </button>
      </div>
    </Modal>
  );
}