'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import { getPlayerDisplayName } from '../lib/tournament/helpers';
import type { Player, SetScore } from '../lib/types';

interface Props {
  open: boolean;
  p1: Player | null;
  p2: Player | null;
  onCancel: () => void;
  onSave: (sets: SetScore[]) => void;
}

interface Row {
  p1: string;
  p2: string;
}

export function ScoreModal({ open, p1, p2, onCancel, onSave }: Props) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (open) {
      setRows([
        { p1: '0', p2: '0' },
        { p1: '0', p2: '0' },
      ]);
    }
  }, [open]);

  if (!p1 || !p2) return <Modal open={false}>{null}</Modal>;

  const handleSave = () => {
    const sets: SetScore[] = rows.map((r) => ({
      p1: parseInt(r.p1, 10) || 0,
      p2: parseInt(r.p2, 10) || 0,
    }));
    onSave(sets);
  };

  return (
    <Modal open={open}>
      <h3 className="mb-4 text-center text-xl font-bold">
        მატჩის ანგარიშის შეყვანა
      </h3>

      <div className="mb-5 flex max-h-[280px] flex-col gap-3 overflow-y-auto">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-[10px] border border-line bg-card px-4 py-3"
          >
            <span className="w-[50px] font-mono text-xs font-bold text-ink-3">
              სეტი {i + 1}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className="max-w-[110px] truncate text-xs text-ink-2"
                  title={getPlayerDisplayName(p1)}
                >
                  {getPlayerDisplayName(p1)}
                </span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={row.p1}
                  onChange={(e) =>
                    setRows((rs) =>
                      rs.map((r, idx) =>
                        idx === i ? { ...r, p1: e.target.value } : r,
                      ),
                    )
                  }
                  className="h-11 w-[52px] rounded-md border border-line bg-app text-center font-mono text-lg font-bold text-ink outline-none focus:border-accent-2"
                />
              </div>
              <span className="font-bold text-ink-2">:</span>
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className="max-w-[110px] truncate text-xs text-ink-2"
                  title={getPlayerDisplayName(p2)}
                >
                  {getPlayerDisplayName(p2)}
                </span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={row.p2}
                  onChange={(e) =>
                    setRows((rs) =>
                      rs.map((r, idx) =>
                        idx === i ? { ...r, p2: e.target.value } : r,
                      ),
                    )
                  }
                  className="h-11 w-[52px] rounded-md border border-line bg-app text-center font-mono text-lg font-bold text-ink outline-none focus:border-accent-2"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setRows((rs) => [...rs, { p1: '', p2: '' }])}
        className="w-full rounded-md border border-dashed border-line-2 bg-overlay py-3 text-sm font-semibold text-ink hover:bg-overlay-hover"
      >
        + სეტის დამატება
      </button>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-md px-5 py-3 text-sm font-semibold text-ink-2 hover:bg-overlay"
        >
          გაუქმება
        </button>
        <button
          onClick={handleSave}
          className="rounded-md bg-accent-2 px-5 py-3 text-sm font-semibold text-white hover:brightness-110"
        >
          შენახვა
        </button>
      </div>
    </Modal>
  );
}