'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Check,
  X,
  Trash2,
  Search,
  UserCheck,
  Clock,
  UserX,
  ShieldCheck,
  Filter,
  CheckSquare,
  Square,
  Phone,
  ChevronDown,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import type { Mode, Player, RegistrationStatus } from '../../lib/types';
import { PlayerValidationRow } from './player-validation-row';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

type PlayerValidationPanelProps = {
  players: Player[];
  onSeedChange: (playerName: string | undefined, index: number, newSeed: number | null) => void;
  onResetSeed: (playerName: string | undefined, index: number) => void;
  onStatusChange?: (id: string, status: RegistrationStatus) => void;
  onAssignToMode?: (id: string, mode: Mode) => void;
  onDeletePlayer?: (id: string) => void;
  onPair?: (id: string, partnerId: string) => void;
  onUnpair?: (id: string) => void;
};

type Tone = 'amber' | 'emerald' | 'rose';

type Secondary = {
  label: string;
  status: 'REJECTED' | 'PENDING';
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone: Tone;
};

const TONE_PILL: Record<Tone, string> = {
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-500',
  emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500',
  rose: 'border-rose-500/20 bg-rose-500/10 text-rose-500',
};

const TONE_OUTLINE_BUTTON: Record<Tone, string> = {
  amber: 'border-amber-500/30 bg-amber-500/5 text-amber-600 hover:bg-amber-500/10',
  emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10',
  rose: 'border-rose-500/30 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10',
};

const MODE_OPTIONS = [
  ['all', 'ყველა რეჟიმი'],
  ['singles', 'Singles'],
  ['doubles', 'Doubles'],
] as const;

function dedupePairs(players: Player[]): Player[] {
  const seen = new Set<string>();
  return players.filter((p) => {
    if (p.mode !== 'doubles' || !p.partner || !p.id) return true;
    const key = [p.id, p.partner.id].sort().join('::');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* ────────────────────────────────────────────────────────── */
/* PlayerStatusRow — PENDING / REJECTED card                   */
/* ────────────────────────────────────────────────────────── */

function PlayerStatusRow({
  player,
  secondary,
  selected,
  onToggle,
  onStatusChange,
  onDeletePlayer,
}: {
  player: Player;
  secondary: Secondary;
  selected: boolean;
  onToggle: (id: string) => void;
  onStatusChange?: (id: string, status: RegistrationStatus) => void;
  onDeletePlayer?: (id: string) => void;
}) {
  const Icon = secondary.icon;
  const hasPartner = player.mode === 'doubles' && !!player.partner;

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-all ${
        selected
          ? 'border-accent/40 bg-accent/5 shadow-sm'
          : 'border-line/50 bg-surface hover:border-line/80 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3 px-3 pb-3 pt-3 sm:px-4 sm:pt-4">
        <button
          type="button"
          onClick={() => player.id && onToggle(player.id)}
          className="mt-0.5 shrink-0 text-ink-2/50 transition hover:text-accent"
          aria-label={selected ? 'Unselect' : 'Select'}
        >
          {selected ? (
            <CheckSquare className="h-5 w-5 text-accent" />
          ) : (
            <Square className="h-5 w-5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold leading-tight text-ink">
              {player.name}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                hasPartner
                  ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/20'
                  : 'bg-slate-100 text-slate-500 ring-1 ring-slate-300/40'
              }`}
            >
              {hasPartner ? 'Doubles' : 'Singles'}
            </span>
          </div>

          {player.phone && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-2">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{player.phone}</span>
            </div>
          )}

          {hasPartner && (
            <div className="mt-2.5 rounded-lg border border-indigo-200/60 bg-indigo-50/50 px-3 py-2">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                პარტნიორი
              </p>
              <span className="text-sm font-semibold text-ink">
                {player.partner!.firstName} {player.partner!.lastName}
              </span>
              {player.partner!.phone && (
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-2">
                  <Phone className="h-3 w-3 shrink-0" />
                  <span>{player.partner!.phone}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line/30 bg-overlay/20 px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => player.id && onStatusChange?.(player.id, 'APPROVED')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 sm:flex-none sm:px-4"
          >
            <Check className="h-3.5 w-3.5" /> დადასტურება
          </button>
          <button
            type="button"
            onClick={() =>
              player.id && onStatusChange?.(player.id, secondary.status)
            }
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold transition sm:flex-none sm:px-4 ${TONE_OUTLINE_BUTTON[secondary.tone]}`}
          >
            <Icon className="h-3.5 w-3.5" /> {secondary.label}
          </button>
        </div>
        <button
          type="button"
          onClick={() => player.id && onDeletePlayer?.(player.id)}
          title="Delete player"
          aria-label={`Delete ${player.name}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-2 transition hover:bg-rose-500/10 hover:text-rose-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Panel                                                       */
/* ────────────────────────────────────────────────────────── */

export function PlayerValidationPanel({
  players,
  onSeedChange,
  onResetSeed,
  onStatusChange,
  onAssignToMode,
  onDeletePlayer,
  onPair,
  onUnpair,
}: PlayerValidationPanelProps) {
  const [tab, setTab] = useState<RegistrationStatus>('PENDING');
  const [query, setQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | Mode>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteCandidate, setDeleteCandidate] = useState<Player | null>(null);

  // ── Mode dropdown state ────────────────────────────────────────────
  const [modeOpen, setModeOpen] = useState(false);
  const modeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!modeOpen) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const el = modeRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setModeOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModeOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [modeOpen]);

  const deduped = useMemo(() => dedupePairs(players), [players]);

  const grouped = useMemo(
    () => ({
      PENDING: deduped.filter((p) => p.status === 'PENDING'),
      APPROVED: deduped.filter((p) => p.status === 'APPROVED'),
      REJECTED: deduped.filter((p) => p.status === 'REJECTED'),
    }),
    [deduped],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return grouped[tab].filter((p) => {
      if (modeFilter !== 'all' && p.mode !== modeFilter) return false;
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.partner?.firstName?.toLowerCase().includes(q) ||
        p.partner?.lastName?.toLowerCase().includes(q) ||
        p.partner?.phone?.includes(q)
      );
    });
  }, [grouped, tab, query, modeFilter]);

  const clearSelection = () => setSelected(new Set());

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(
      selected.size === visible.length
        ? new Set()
        : new Set(visible.map((p) => p.id).filter(Boolean) as string[]),
    );

  const batchStatus = (status: RegistrationStatus) => {
    selected.forEach((id) => onStatusChange?.(id, status));
    clearSelection();
  };

  const requestDelete = (id: string) => {
    const player = deduped.find((p) => p.id === id);
    if (player) setDeleteCandidate(player);
  };

  const confirmDelete = () => {
    if (deleteCandidate?.id) {
      onDeletePlayer?.(deleteCandidate.id);
    }
    setDeleteCandidate(null);
  };

  const tabs: {
    key: RegistrationStatus;
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    count: number;
    tone: Tone;
  }[] = [
    { key: 'PENDING', label: 'განაცხადები', icon: Clock, count: grouped.PENDING.length, tone: 'amber' },
    { key: 'APPROVED', label: 'დადასტურებული', icon: UserCheck, count: grouped.APPROVED.length, tone: 'emerald' },
    { key: 'REJECTED', label: 'უარყოფილი', icon: UserX, count: grouped.REJECTED.length, tone: 'rose' },
  ];

  const secondary: Secondary =
    tab === 'PENDING'
      ? { label: 'უარყოფა', status: 'REJECTED', icon: X, tone: 'rose' }
      : { label: 'დაბრუნება', status: 'PENDING', icon: ShieldCheck, tone: 'amber' };

  const currentModeLabel =
    MODE_OPTIONS.find(([value]) => value === modeFilter)?.[1] ?? 'ყველა რეჟიმი';

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-line/40 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid w-full min-w-0 grid-cols-1 gap-1 rounded-xl border border-line/40 bg-overlay/30 p-1 sm:grid-cols-3">
          {tabs.map(({ key, label, count, tone }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTab(key);
                  clearSelection();
                }}
                className={`flex min-w-0 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold sm:flex-col sm:items-center sm:justify-center sm:px-2 sm:text-center ${
                  active ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink'
                }`}
              >
                <span className="min-w-0 break-words">{label}</span>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${TONE_PILL[tone]}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-2" />
            <input
              type="text"
              placeholder="ძებნა სახელის ან ნომრის მიხედვით..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-line/40 bg-surface py-1.5 pl-9 pr-3 text-xs text-ink placeholder:text-ink-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </div>

          {/* ── Live mode dropdown ─────────────────────────────── */}
          <div ref={modeRef} className="relative w-full min-w-0 sm:w-auto">
            <button
              type="button"
              onClick={() => setModeOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={modeOpen}
              className="relative inline-flex h-[34px] w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-line/40 bg-surface pl-8 pr-2.5 text-xs font-medium text-ink transition hover:border-accent/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40 sm:h-[30px] sm:w-auto sm:min-w-[150px]"
            >
              <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-2" />
              <span className="flex-1 truncate text-left">{currentModeLabel}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-ink-2 transition-transform duration-150 ${
                  modeOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {modeOpen && (
              <ul
                role="listbox"
                className="absolute right-0 z-50 mt-1 w-full min-w-[150px] overflow-hidden rounded-lg border border-line/40 bg-panel py-1 shadow-xl"
              >
                {MODE_OPTIONS.map(([value, label]) => {
                  const active = modeFilter === value;
                  return (
                    <li key={value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          setModeFilter(value);
                          setModeOpen(false);
                        }}
                        className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-xs transition ${
                          active
                            ? 'bg-accent/10 font-semibold text-accent'
                            : 'text-ink hover:bg-overlay'
                        }`}
                      >
                        <span>{label}</span>
                        {active && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Batch toolbar ───────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-2.5">
          <span className="text-xs font-semibold text-ink">
            {selected.size} მოთამაშე არჩეულია
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => batchStatus('APPROVED')}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500"
            >
              ყველას დადასტურება
            </button>
            <button
              type="button"
              onClick={() => batchStatus('REJECTED')}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${TONE_OUTLINE_BUTTON.rose}`}
            >
              ყველას უარყოფა
            </button>
          </div>
        </div>
      )}

      {/* ── List ────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-overlay/10 p-2">
        {visible.length === 0 ? (
          <div className="py-12 text-center text-xs font-medium text-ink-2">
            მონაცემები ვერ მოიძებნა
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tab !== 'APPROVED' && (
              <div className="flex items-center rounded-lg bg-overlay/30 px-4 py-2 text-[11px] font-semibold text-ink-2">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center gap-2 hover:text-ink"
                >
                  {selected.size === visible.length && visible.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-accent" />
                  ) : (
                    <Square className="h-4 w-4 text-ink-2" />
                  )}
                  ყველას მონიშვნა
                </button>
              </div>
            )}

            {tab === 'APPROVED'
              ? visible.map((player, idx) => (
                  <PlayerValidationRow
                    key={player.id || player.name || idx}
                    player={player}
                    index={idx}
                    allPlayers={deduped}
                    onSeedChange={onSeedChange}
                    onResetSeed={onResetSeed}
                    onAssignToMode={onAssignToMode}
                    onDeletePlayer={requestDelete}
                    onPair={onPair}
                    onUnpair={onUnpair}
                  />
                ))
              : visible.map((player) => (
                  <PlayerStatusRow
                    key={player.id || player.name}
                    player={player}
                    selected={player.id ? selected.has(player.id) : false}
                    onToggle={toggleOne}
                    secondary={secondary}
                    onStatusChange={onStatusChange}
                    onDeletePlayer={requestDelete}
                  />
                ))}
          </div>
        )}
      </div>

      {/* ── Delete confirmation modal ──────────────────────────── */}
      <ConfirmDeleteModal
        open={!!deleteCandidate}
        playerName={deleteCandidate?.name ?? ''}
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}