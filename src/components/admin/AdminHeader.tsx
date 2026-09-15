import Link from 'next/link';
import { Home } from 'lucide-react';

export function AdminHeader() {
  return (
    <header className="mb-8">
      <div className="flex flex-col gap-6 rounded-3xl border border-line/50 bg-overlay/40 p-5 shadow-sm backdrop-blur-sm sm:p-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight sm:text-4xl lg:text-3xl">
            Admin <span className="text-accent-2">Panel</span>
          </h1>

          <p className="mt-2 max-w-xl text-sm text-ink-2">Poti Special Open 2026</p>
        </div>

        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-line/60 bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent/50 hover:bg-overlay hover:text-accent"
        >
          <Home className="h-4 w-4" />
          მთავარი გვერდი
        </Link>
      </div>
    </header>
  );
}