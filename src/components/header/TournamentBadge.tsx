import type { Mode } from '../../lib/types';

interface Props {
  mode: Mode;
  size: number;
  numRounds: number;
}

export function TournamentBadge({ size, numRounds }: Props) {
  return (
    <div
      title={`${size} სლოტი · ${numRounds} რაუნდი`}
      className="hidden md:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line/60 bg-overlay/80 px-1.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-accent shadow-xs backdrop-blur-sm sm:gap-2 sm:px-3.5 sm:py-1.5 sm:text-xs"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </span>
      <span className="hidden sm:inline">{size}-სლოტი</span>
      <span className="hidden text-line-2 sm:inline">·</span>
      <span className="hidden sm:inline">{numRounds} რაუნდი</span>
    </div>
  );
}