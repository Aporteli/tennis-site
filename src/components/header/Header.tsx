'use client';

import type { Mode, TournamentStats } from '../../lib/types';
import { HeaderActions } from '../header/HeaderActions';
import { TournamentBadge } from '../header/TournamentBadge';
import { StatsStrip } from '../header/StatsStrip';
import { useHideOnScroll } from '../../hooks/useHideOnScroll';

interface Props {
  mode: Mode;
  size: number;
  numRounds: number;
  stats: TournamentStats;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  onAuthClick: () => void;
  onRegisterClick?: () => void;
}

export function Header({
  mode,
  size,
  numRounds,
  stats,
  isLoggedIn,
  isAdmin = false,
  onAuthClick,
  onRegisterClick,
}: Props) {
  const label = mode === 'doubles' ? 'წყვილი' : 'მოთამაშე';
  const isVisible = useHideOnScroll();

  return (
    <header
      className={`sticky top-0 z-50 mb-4 w-full rounded-2xl border border-line/50 bg-overlay/60 p-3 shadow-sm backdrop-blur-md transition-transform duration-300 sm:mb-8 sm:rounded-3xl sm:p-5 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {/* Row 1 — title + actions */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <h1 className="min-w-0 truncate font-display text-base font-black uppercase leading-tight tracking-wide sm:text-2xl md:text-[clamp(28px,4.5vw,44px)] md:leading-none">
  <span className="text-[#0A192F]">Poti{' '}</span>
  <span className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] bg-clip-text text-transparent inline-block pb-1">Winter</span>
  <span className="bg-gradient-to-br from-[#06B6D4] to-[#0EA5E9] bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(6,182,212,0.3)] inline-block pb-1">Cup</span>{' '}
  <span className="text-[#0A192F]">2026</span>
</h1>

        <HeaderActions
          isLoggedIn={isLoggedIn}
          isAdmin={isAdmin}
          onAuthClick={onAuthClick}
          onRegisterClick={onRegisterClick}
        />
      </div>

      {/* Row 2 — live badge + stats strip */}
      <div className="mt-2 flex items-center justify-between gap-2 overflow-hidden sm:mt-3">
        <TournamentBadge mode={mode} size={size} numRounds={numRounds} />
        <StatsStrip label={label} stats={stats} />
      </div>
    </header>
  );
}