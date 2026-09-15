import { Dice5, Users } from 'lucide-react';
import type { TournamentMode } from '../../types/tournament';
import type { Player } from '../../lib/types';

type TournamentStatusProps = {
  mode: TournamentMode;
  registrations: Player[];
  hasExistingDraw: boolean;
};

/**
 * Admin-validation gate.
 * ⚠️ Adjust the field name here to match your Player type
 *    (e.g. `p.approved`, `p.isValidated`, `p.status === 'approved'`).
 */
const isValidated = (p: Player): boolean => p.status === 'APPROVED';

function countSingles(regs: Player[]): number {
  return regs.filter((p) => p.mode === 'singles' && isValidated(p)).length;
}

/** Counts doubles teams — a paired player + partner counts as ONE team. */
function countDoublesTeams(regs: Player[]): number {
  const seen = new Set<string>();
  for (const p of regs) {
    if (p.mode !== 'doubles' || !p.id) continue;
    if (!isValidated(p)) continue;

    // If BOTH partners must be admin-validated, uncomment:
    // if (p.partner && !isValidated(p.partner)) continue;

    const key = p.partner ? [p.id, p.partner.id].sort().join('::') : `solo:${p.id}`;
    seen.add(key);
  }
  return seen.size;
}

export function TournamentStatus({ mode, registrations, hasExistingDraw }: TournamentStatusProps) {
  const singlesCount = countSingles(registrations);
  const doublesCount = countDoublesTeams(registrations);

  return (
    <section className="mb-8 grid gap-6 sm:grid-cols-3">
      {/* Format */}
      <div className="rounded-2xl border border-line/40 bg-gradient-to-br from-overlay/60 to-panel/60 p-6 shadow-lg hover:scale-[1.025] hover:shadow-2xl transition-all duration-300">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[13px] font-semibold uppercase tracking-wider text-accent-2">ფორმატი</span>
          <Dice5 className="h-5 w-5 text-accent drop-shadow-glow animate-fade-in" />
        </div>
        <div
          className={`text-2xl sm:text-3xl font-bold capitalize flex items-center gap-2 text-accent ${
            mode === 'singles' ? 'text-accent' : 'text-accent'
          }`}>
          {mode === 'singles' ? 'ერთეულები' : 'წყვილები'}
        </div>
        <p className="mt-2 text-sm text-ink-2">ამ ტურნირის მოქმედი ფორმატი</p>
      </div>

      {/* Registered — validated singles + doubles side by side */}
      <div className="rounded-2xl border border-line/40 bg-gradient-to-br from-win/5 to-accent-2/10 p-6 shadow-xl hover:scale-[1.025] hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[13px] font-semibold uppercase tracking-wider text-accent-2">მონაწილეობა</span>
          <Users className="h-5 w-5 text-accent-2 animate-fade-in" />
        </div>

        <div className="flex flex-row items-center justify-around gap-2">
          {/* Singles */}
          <div className="flex flex-col items-center min-w-0 text-center">
            <div
              className={`flex flex-wrap items-baseline justify-center gap-1.5 transition-all duration-300 ${
                mode === 'singles' ? 'text-accent-2 drop-shadow-glow scale-105' : 'text-ink group-hover:text-accent'
              }`}
              title="დადასტურებული ერთეულები">
              <span className="text-2xl sm:text-3xl font-extrabold">{singlesCount}</span>
              <span className="px-2 py-0.5 rounded-lg bg-accent/10 text-accent-2 text-[11px] font-semibold shadow-sm whitespace-nowrap">
                დადასტურებული
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-[13px] text-ink-2 tracking-wide font-medium truncate max-w-full">
              ერთეულები
            </p>
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-line/40 rounded-xl shrink-0"></div>

          {/* Doubles */}
          <div className="flex flex-col items-center min-w-0 text-center">
            <div
              className={`flex flex-wrap items-baseline justify-center gap-1.5 transition-all duration-300 ${
                mode === 'doubles' ? 'text-accent-2 drop-shadow-glow scale-105' : 'text-ink group-hover:text-accent'
              }`}
              title="დადასტურებული წყვილები">
              <span className="text-2xl sm:text-3xl font-extrabold">{doublesCount}</span>
              <span className="px-2 py-0.5 rounded-lg bg-accent-2/10 text-accent-2 text-[11px] font-semibold shadow-sm whitespace-nowrap">
                დადასტურებული
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-[13px] text-ink-2 tracking-wide font-medium truncate max-w-full">
              წყვილები
            </p>
          </div>
        </div>
      </div>

      {/* Draw status */}
      <div className="rounded-2xl border border-line/40 bg-gradient-to-br from-overlay/60 to-win/10 p-6 shadow-lg hover:scale-[1.025] hover:shadow-2xl transition-all duration-300">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[13px] font-semibold uppercase tracking-wider text-accent-2">ბადის სტატუსი</span>
          <span
            className="relative flex items-center"
            title={hasExistingDraw ? 'ბადე უკვე გენერირებულია' : 'ბადე ჯერ არ გენერირებულია'}>
            <span
              className={`h-3 w-3 rounded-full transition-all duration-200 border-2 border-panel ${
                hasExistingDraw ? 'bg-win-strong shadow-pulse animate-pulse' : 'bg-ink-2/40'
              }`}
            />
            {hasExistingDraw && (
              <span className="absolute inset-0 flex items-center justify-center animate-fade-in">
                <svg className="h-3 w-3 text-win" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 16 16">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 8l2.5 2.5 4.5-5" />
                </svg>
              </span>
            )}
          </span>
        </div>
        <div
          className={`text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2 ${
            hasExistingDraw ? 'text-win' : 'text-ink-2'
          }`}>
          {hasExistingDraw ? (
            <>
              <span>მზადაა</span>
              <span className="rounded-full bg-win/20 px-2.5 py-0.5 text-xs text-win font-semibold shadow animate-fade-in whitespace-nowrap">
                ✓ გენერირებული
              </span>
            </>
          ) : (
            <span>არ დამზადებულა</span>
          )}
        </div>
        <p className="mt-3 text-sm text-ink-2">
          {hasExistingDraw
            ? 'ბადე შექმნილია და მზადაა მატჩებისთვის.'
            : 'გთხოვთ დააგენერიროთ ბადე, რათა დაიწყოთ თამაშები.'}
        </p>
      </div>
    </section>
  );
}
