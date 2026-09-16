'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Player } from '../lib/types';
import { shortName } from '../lib/tournament/helpers';
import { RegisteredPlayersList, type Participant } from './RegisteredPlayersList';

interface BracketEmptyStateProps {
  targetDate?: Date;
  onRegisterClick?: () => void;
  registrations: Player[];
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = targetDate.getTime() - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex justify-center gap-4 py-4 text-center">
      {[
        { label: 'დღე', val: timeLeft.days },
        { label: 'საათი', val: timeLeft.hours },
        { label: 'წუთი', val: timeLeft.minutes },
        { label: 'წამი', val: timeLeft.seconds },
      ].map((item, idx) => (
        <div
          key={idx}
          className="flex min-w-[70px] flex-col items-center rounded-xl border border-line bg-surface-2 p-3">
          <span className="font-display text-2xl font-bold text-ink">{item.val}</span>
          <span className="text-xs uppercase tracking-wider text-ink-2">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function BracketEmptyState({ targetDate, onRegisterClick, registrations = [] }: BracketEmptyStateProps) {
  const effectiveDate = targetDate ?? new Date(Date.now() + 86400000 * 3);

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
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
        </span>
        ტურნირის ბადე ჯერ არ არის დაგენერირებული
      </div>

      <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">მზადება ტურნირისთვის</h2>
      <p className="mt-2 text-sm text-ink-2 mb-4">
        რეგისტრაცია მიმდინარეობს. ტურნირის ბადე გამოქვეყნდება კენჭისყრის დასრულებისთანავე.
      </p>

      {onRegisterClick && (
        <div className="mb-8">
          <button
            onClick={onRegisterClick}
            className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
            დარეგისტრირდი ტურნირზე
          </button>
        </div>
      )}

      <RegisteredPlayersList participants={participants} />
    </div>
  );
}
