import { RotateCcw, Sparkles, Trash2, Users } from 'lucide-react';
import type { TournamentMode } from '../../types/tournament';

type DrawControlsProps = {
  mode: TournamentMode;
  isDrawing: boolean;
  hasExistingDraw: boolean;
  canUndo: boolean;
  onManagePlayers: () => void;
  onDrawToggle: () => void;
  onSwitchMode: (mode: TournamentMode) => void;
  onUndo: () => void;
};

function ModeToggle({ mode, onSwitchMode }: Pick<DrawControlsProps, 'mode' | 'onSwitchMode'>) {
  return (
    <div className="flex w-full rounded-xl border border-line/60 bg-surface p-1 shadow-inner transition-all duration-500 sm:w-auto">
      <button
        onClick={() => onSwitchMode('singles')}
        className={`flex flex-1 items-center justify-center gap-1 cursor-pointer rounded-lg px-3 py-2 text-[13px] font-bold sm:flex-none sm:px-5 
          transition-all duration-300
          ${
            mode === 'singles'
              ? 'bg-accent text-inverse shadow-md scale-105'
              : 'bg-transparent text-ink-2 hover:text-accent hover:bg-accent/10'
          }`}
        aria-pressed={mode === 'singles'}
        tabIndex={0}
        style={{
          transition: 'background 0.3s, color 0.3s, box-shadow 0.3s, transform 0.3s',
        }}>
        ერთეულები
      </button>

      <button
        onClick={() => onSwitchMode('doubles')}
        className={`flex flex-1 items-center justify-center gap-1 cursor-pointer rounded-lg px-3 py-2 text-[13px] font-bold sm:flex-none sm:px-5 
          transition-all duration-300
          ${
            mode === 'doubles'
              ? 'bg-accent text-inverse shadow-md scale-105'
              : 'bg-transparent text-ink-2 hover:text-accent hover:bg-accent/10'
          }`}
        aria-pressed={mode === 'doubles'}
        tabIndex={0}
        style={{
          transition: 'background 0.3s, color 0.3s, box-shadow 0.3s, transform 0.3s',
        }}>
        წყვილები
      </button>
    </div>
  );
}

export function DrawControls({
  mode,
  isDrawing,
  hasExistingDraw,
  canUndo,
  onManagePlayers,
  onDrawToggle,
  onSwitchMode,
  onUndo,
}: DrawControlsProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-line/50 bg-overlay/40 shadow-lg ring-1 ring-accent/10">
      <div className="border-b border-line/40 px-6 py-7 bg-gradient-to-br from-panel/60 to-surface/30">
        <div className="flex flex-col w-full justify-between gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-2xl font-black tracking-tight mt-1 text-ink-2 select-none">
              ბადის გენერაცია / მოთამაშეები{' '}
            </p>
          </div>
          <ModeToggle mode={mode} onSwitchMode={onSwitchMode} />
        </div>
      </div>

      {/* ღილაკების სექცია გამოყოფილია ზედა ნაწილისგან შიდა დაშორებით (p-5) და ერთმანეთისგან (gap-5) */}
      <div className="grid gap-5 p-5 sm:grid-cols-2 bg-surface/20">
        {/* Players List */}
        <button
          onClick={onManagePlayers}
          disabled={isDrawing}
          className="group relative cursor-pointer bg-gradient-to-br from-surface to-panel/80 p-7 text-left transition-all duration-300 hover:bg-accent-2/5 hover:border-accent/40 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-accent/80 rounded-2xl shadow-sm border border-line/40">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-2/10 text-accent-2 shadow-inner group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-black text-[17px] mb-1 tracking-tight group-hover:text-accent transition">
              {mode === 'doubles' ? 'წყვილების სია' : 'ერთეულების სია'}
            </h3>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-accent-2 group-hover:text-accent group-hover:gap-3 transition-all">
            <span>სიის ნახვა</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1 text-lg">→</span>
          </div>
          <span className="absolute top-3 right-4 opacity-0 group-hover:opacity-80 text-ink-3 text-[10px] transition pointer-events-none select-none">
            დააჭირე სიის სანახავად
          </span>
        </button>
   

        {/* Draw/Reset */}
        <button
          onClick={onDrawToggle}
          disabled={isDrawing}
          className="group relative cursor-pointer bg-gradient-to-br from-surface to-panel/80 p-7 text-left transition-all duration-300 hover:bg-accent-2/5 hover:border-accent/40 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 outline-none focus-visible:ring-2 focus-visible:ring-accent/80 rounded-2xl shadow-sm border border-line/40">
          <div className="flex flex-col items-center justify-center">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl
              ${hasExistingDraw ? 'bg-win/20 text-win' : 'bg-accent-2/10 text-accent-2'}
              shadow-inner group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300`}>
              {hasExistingDraw ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <Sparkles className="h-6 w-6" />
              )}
            </div>
            <h3 className={`font-black text-[17px] mb-1 tracking-tight group-hover:text-accent transition
              ${hasExistingDraw ? 'text-win' : ''}`}>
              {hasExistingDraw ? 'ბადის განულება' : 'ბადის გენერაცია'}
            </h3>
          </div>
          <div className={`mt-3 flex items-center justify-center gap-2 text-sm font-semibold
            ${hasExistingDraw ? 'text-win group-hover:text-accent' : 'text-accent-2 group-hover:text-accent'}
            group-hover:gap-3 transition-all`}>
            <span>{hasExistingDraw ? 'ბადის წაშლა' : 'გენერაცია'}</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1 text-lg">→</span>
          </div>
          <span className="absolute top-3 right-4 opacity-0 group-hover:opacity-80 text-ink-3 text-[10px] transition pointer-events-none select-none">
            {hasExistingDraw ? 'დააჭირე ბადის წასაშლელად' : 'დააჭირე გენერაციის დასაწყებად'}
          </span>
        </button>
   
      </div>

      {canUndo && (
        <div className="border-t border-line/40 bg-overlay/20 p-4 flex justify-center">
          <button
            onClick={onUndo}
            className="flex w-full sm:w-auto cursor-pointer items-center justify-center gap-2 rounded-xl border border-accent/60 bg-surface px-6 py-3 text-sm font-bold text-accent-2 transition hover:bg-accent/10 hover:text-accent hover:shadow-lg active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
            <RotateCcw className="h-5 w-5" />
            ბოლო ქმედების გაუქმება
          </button>
        </div>
      )}
    </section>
  );
}
