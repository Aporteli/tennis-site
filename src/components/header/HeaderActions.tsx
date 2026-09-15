'use client';

import Link from 'next/link';
import { ShieldIcon } from '../header/ShieldIcon';

interface Props {
  isLoggedIn: boolean;
  isAdmin?: boolean;
  onAuthClick: () => void;
  onRegisterClick?: () => void; // დაემატა რეგისტრაციის მოდალის გახსნის პროპსი
}

// მარტივი იკონი რეგისტრაციის ღილაკისთვის
function UserPlusIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    </svg>
  );
}

export function HeaderActions({
  isLoggedIn,
  isAdmin = false,
  onAuthClick,
  onRegisterClick,
}: Props) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      {/* 1. ტურნირზე რეგისტრაციის ღილაკი */}
      <button
        type="button"
        onClick={onRegisterClick}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-bold text-inverse shadow-xs transition-all duration-200 hover:opacity-90 active:scale-95 sm:px-4 sm:py-1.5"
      >
        <UserPlusIcon />
        <span>რეგისტრაცია</span>
      </button>

      {/* 2. ადმინ პანელის ბმული (გამოჩნდება მხოლოდ ავტორიზებულ ადმინზე) */}
      {isAdmin && (
        <Link
          href="/admin"
          aria-label="ადმინ პანელი"
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-xs font-bold text-accent shadow-xs transition-all duration-200 hover:bg-accent hover:text-inverse active:scale-95 sm:px-3.5 sm:py-1.5"
        >
          <ShieldIcon />
          <span className="hidden sm:inline">ადმინ პანელი</span>
        </Link>
      )}

      {/* 3. Log in / Log out ღილაკი */}
      <button
        type="button"
        onClick={onAuthClick}
        className="group relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-full border border-line/70 bg-overlay px-3 py-1 text-xs font-semibold text-ink shadow-xs transition-all duration-200 hover:border-accent hover:bg-accent/5 hover:text-accent active:scale-95 sm:px-4 sm:py-1.5"
      >
        <span className="relative z-10">{isLoggedIn ? 'Log out' : 'Log in'}</span>
      </button>
    </div>
  );
}