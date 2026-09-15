'use client';

import type { Mode, TournamentStats } from '../../lib/types';
import { HeaderActions } from '../header/HeaderActions';
import { MetaPill } from '../header/MetaPill';
import { TournamentBadge } from '../header/TournamentBadge';
import { useHideOnScroll } from '../../hooks/useHideOnScroll';

interface Props {
  mode: Mode;
  size: number;
  numRounds: number;
  stats: TournamentStats;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  onAuthClick: () => void;
  onRegisterClick?: () => void; // დაემატა რეგისტრაციის მოდალის გახსნის ფუნქცია
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
      className={`sticky top-0 z-50 mb-6 w-full rounded-3xl border border-line/50 bg-overlay/40 p-5 shadow-sm backdrop-blur-sm transition-transform duration-300 sm:mb-8 sm:px-6 sm:py-4 lg:px-8 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex w-full items-center justify-between gap-2 sm:gap-4">
          <TournamentBadge mode={mode} size={size} numRounds={numRounds} />
          
          <HeaderActions
            isLoggedIn={isLoggedIn}
            isAdmin={isAdmin}
            onAuthClick={onAuthClick}
            onRegisterClick={onRegisterClick}
          />
        </div>

        <div className="flex w-full flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="font-display text-lg font-black uppercase leading-tight tracking-tight text-ink sm:text-[clamp(28px,4.5vw,44px)] sm:leading-none">
              Poti <span className="text-accent-2 drop-shadow-sm">Special Open</span> 2026
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <MetaPill label={label} value={stats.total} />
            <MetaPill label="განთესილი" value={stats.seeds} highlight />
            <MetaPill label="Bye" value={stats.byes} />
          </div>
        </div>
      </div>
    </header>
  );
}