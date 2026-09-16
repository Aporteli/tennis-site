'use client';

import Link from 'next/link';
import { LogIn, LogOut, UserPlus } from 'lucide-react';
import { ShieldIcon } from '../header/ShieldIcon';

interface Props {
  isLoggedIn: boolean;
  isAdmin?: boolean;
  onAuthClick: () => void;
  onRegisterClick?: () => void;
}

export function HeaderActions({
  isLoggedIn,
  isAdmin = false,
  onAuthClick,
  onRegisterClick,
}: Props) {
  return (
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      {/* Register — primary CTA */}
      {/* <button
        type="button"
        onClick={onRegisterClick}
        aria-label="რეგისტრაცია"
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-2.5 py-1.5 text-xs font-bold text-inverse shadow-xs transition-all duration-200 hover:opacity-90 active:scale-95 sm:px-4 sm:py-1.5"
      >
        <UserPlus className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">რეგისტრაცია</span>
      </button> */}

      {/* Admin panel link */}
      {isAdmin && (
        <Link
          href="/admin"
          aria-label="ადმინ პანელი"
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2 py-1.5 text-xs font-bold text-accent shadow-xs transition-all duration-200 hover:bg-accent hover:text-inverse active:scale-95 sm:px-3.5 sm:py-1.5"
        >
          <ShieldIcon />
          <span className="hidden sm:inline">ადმინ პანელი</span>
        </Link>
      )}

      {/* Login / Logout */}
      <button
        type="button"
        onClick={onAuthClick}
        aria-label={isLoggedIn ? 'Log out' : 'Log in'}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line/70 bg-overlay px-2 py-1.5 text-xs font-semibold text-ink shadow-xs transition-all duration-200 hover:border-accent hover:bg-accent/5 hover:text-accent active:scale-95 sm:px-4 sm:py-1.5"
      >
        {isLoggedIn ? (
          <LogOut className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <LogIn className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="hidden sm:inline">
          {isLoggedIn ? 'Log out' : 'Log in'}
        </span>
      </button>
    </div>
  );
}