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
    <nav className="mb-6 flex items-center gap-1 overflow-x-auto rounded-2xl border border-line/50 bg-overlay/40 p-1.5">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
            activeTab === id ? 'bg-accent text-inverse shadow-sm' : 'text-ink-2 hover:bg-overlay hover:text-ink'
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </nav>
  );
}