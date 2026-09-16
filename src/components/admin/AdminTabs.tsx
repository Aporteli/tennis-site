import { Dice5, UserCheck } from 'lucide-react';
import type { AdminTab } from '../../types/tournament';

type AdminTabsProps = {
  activeTab: AdminTab;
  onChange: (tab: AdminTab) => void;
};

const tabs = [
  { id: 'draw' as const, label: 'ბადე', icon: Dice5 },
  { id: 'validation' as const, label: 'მოთამაშეების ვალიდაცია', icon: UserCheck },
];

export function AdminTabs({ activeTab, onChange }: AdminTabsProps) {
  return (
    <nav className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-line/50 bg-overlay/40 p-1.5 sm:flex sm:items-center">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex min-w-0 w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-center text-xs font-semibold leading-tight transition sm:w-auto sm:shrink-0 sm:px-5 sm:text-sm ${
            activeTab === id ? 'bg-accent text-inverse shadow-sm' : 'text-ink-2 hover:bg-overlay hover:text-ink'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="min-w-0 whitespace-normal">{label}</span>
        </button>
      ))}
    </nav>
  );
}