interface Props {
    label: string;
    value: number;
    highlight?: boolean;
  }
  
  export function MetaPill({ label, value, highlight = false }: Props) {
    return (
      <div
        className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 font-mono text-[11px] shadow-xs transition-all duration-150 sm:gap-2.5 sm:px-3.5 sm:py-1.5 sm:text-xs ${
          highlight
            ? 'border-accent/40 bg-accent/10 font-semibold text-accent'
            : 'border-line/60 bg-overlay/60 text-ink-2'
        }`}
      >
        <strong className="text-xs font-black text-ink sm:text-sm">{value}</strong>
        <span className="font-medium tracking-wide">{label}</span>
      </div>
    );
  }