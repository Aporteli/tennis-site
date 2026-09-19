'use client';

import { useMemo } from 'react';
import type { Player } from '../lib/types';
import { shortName } from '../lib/tournament/helpers';
import { RegisteredPlayersList, type Participant } from './RegisteredPlayersList';

interface BracketEmptyStateProps {
  targetDate?: Date;
  onRegisterClick?: () => void;
  registrations: Player[];
}

export function BracketEmptyState({
  onRegisterClick,
  registrations = [],
}: BracketEmptyStateProps) {
  const participants: Participant[] = useMemo(() => {
    const approved = registrations.filter((p) => p.status === 'APPROVED');

    // ── Singles: full name, approved, no partner ──────────────────
    const singles: Participant[] = approved
      .filter((p) => (p.assignedMode ?? p.mode) !== 'doubles' && !p.partner)
      .map((p) => ({
        id: p.id ?? p.name,
        name: p.name,
        seed: p.seed ?? null,
        kind: 'singles' as const,
      }));

    // ── Doubles: "გ.ნებიერაძე/შ.ხმალაძე", deduped across both halves
    const seenPairs = new Set<string>();
    const doubles: Participant[] = [];

    for (const p of approved) {
      const isDoubles = (p.assignedMode ?? p.mode) === 'doubles' || Boolean(p.partner);
      if (!isDoubles) continue;
      const selfId = p.id ?? p.name;
      const partnerId = p.partner?.id ?? p.partner?.firstName ?? '';
      const key = partnerId ? [selfId, partnerId].sort().join('::') : selfId;

      if (seenPairs.has(key)) continue;
      seenPairs.add(key);

      const left = shortName(p.name);
      const partnerFull = p.partner ? `${p.partner.firstName} ${p.partner.lastName}`.trim() : '';
      const right = partnerFull ? shortName(partnerFull) : '';

      doubles.push({
        id: selfId,
        name: right ? `${left}/${right}` : left,
        seed: p.seed ?? null,
        kind: 'doubles',
      });
    }

    return [...singles, ...doubles];
  }, [registrations]);

  return (
    <div className="mx-auto my-8 max-w-4xl px-4">
      {/* Main Container / Glass Card */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-1/40 p-6 shadow-sm backdrop-blur-md sm:p-8">
        
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />

        <div className="mx-auto max-w-xl text-center">
          {/* Status Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1 text-xs font-semibold text-accent">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
            </span>
            ტურნირის ბადე ჯერ არ არის დაგენერირებული
          </div>

          {/* Title & Description */}
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            მზადება ტურნირისთვის
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">
            რეგისტრაცია მიმდინარეობს. ტურნირის ბადე გამოქვეყნდება კენჭისყრის დასრულებისთანავე.
          </p>

          {/* CTA Button */}
          {onRegisterClick && (
            <div className="mt-6">
              <button
                onClick={onRegisterClick}
                className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-md shadow-accent/20 transition-all hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/30 active:scale-95"
              >
                დარეგისტრირდი ტურნირზე
              </button>
            </div>
          )}
        </div>

        {/* Players List Container */}
        <div className="mt-8 border-t border-line/50 pt-2">
          <RegisteredPlayersList participants={participants} />
        </div>
      </div>
    </div>
  );
}