import type { Mode } from '../../lib/types';

interface Props {
  mode: Mode;
  size: number;
  numRounds: number;
}

export function TournamentBadge({ mode, size, numRounds }: Props) {
  return (
    <div className="inline-flex max-w-[70%] items-center gap-1.5 overflow-hidden rounded-full border border-line/60 bg-overlay/80 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-accent shadow-xs backdrop-blur-sm sm:max-w-none sm:px-3.5 sm:py-1.5 sm:text-xs">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </span>

      {/* <span className="truncate">
        {mode === 'doubles' ? 'წყვილები' : 'ერთეულები'}
        <span className="hidden sm:inline"> განთესვა</span>
      </span> */}

      <span className="text-line-2">·</span>
      <span className="shrink-0">{size}-სლოტი</span>
      <span className="hidden text-line-2 sm:inline">·</span>
      <span className="hidden sm:inline">{numRounds} რაუნდი</span>
    </div>
  );
}