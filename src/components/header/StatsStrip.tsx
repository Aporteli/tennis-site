import type { TournamentStats } from '../../lib/types';

interface Props {
  label: string;
  stats: TournamentStats;
}

export function StatsStrip({ label, stats }: Props) {
  return (
    <div
      className={`flex items-center gap-1.5 overflow-x-auto whitespace-nowrap font-mono text-[11px] sm:gap-2.5 sm:text-xs`}
    >
      <Chip label={label} value={stats.total} />
      <Dot />
      <Chip label="განთესილი" value={stats.seeds} accent />
      <Dot />
      <Chip label="Bye" value={stats.byes} />
    </div>
  );
}

function Chip({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <span className="inline-flex shrink-0 items-baseline gap-1">
      <strong
        className={`text-xs font-black tabular-nums sm:text-sm ${
          accent ? 'text-accent' : 'text-ink'
        }`}
      >
        {value}
      </strong>
      <span
        className={`font-medium tracking-wide ${
          accent ? 'text-accent/80' : 'text-ink-2'
        }`}
      >
        {label}
      </span>
    </span>
  );
}

function Dot() {
  return <span className="shrink-0 text-line-2/70">·</span>;
}