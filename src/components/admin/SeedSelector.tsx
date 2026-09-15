import { SEED_OPTIONS } from '../../constants/seeds';

type SeedSelectorProps = {
  value: number | string;
  onChange: (value: string) => void;
};

export function SeedSelector({ value, onChange }: SeedSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="cursor-pointer rounded-xl border border-line/60 bg-surface px-3 py-1.5 text-xs font-bold text-ink transition focus:border-accent focus:outline-none"
    >
      <option value="">Unseeded</option>

      {SEED_OPTIONS.map((seed) => (
        <option key={seed} value={seed}>
          Seed #{seed}
        </option>
      ))}
    </select>
  );
}