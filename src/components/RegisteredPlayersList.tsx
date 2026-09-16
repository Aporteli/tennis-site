'use client';

import { useState, useMemo, useEffect } from 'react';
import { MarqueeText } from './MarqueeText';

export type Participant = {
  id: string;
  name: string;
  seed: number | null;
  kind: 'singles' | 'doubles';
};

interface Props {
  participants: Participant[];
}

type CategoryTab = 'singles' | 'doubles';
type FilterTab = 'all' | 'seeded' | 'unseeded';

/** Max height for the inline preview list before it becomes scrollable. */
const PREVIEW_MAX_HEIGHT = 440;

export function RegisteredPlayersList({ participants }: Props) {
  const [category, setCategory] = useState<CategoryTab>('singles');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModalOpen]);

  const categoryPlayers = useMemo(
    () => participants.filter((p) => p.kind === category),
    [participants, category],
  );

  const seededCount = useMemo(
    () => categoryPlayers.filter((p) => p.seed != null && p.seed > 0).length,
    [categoryPlayers],
  );

  const previewPlayers = useMemo(() => {
    const sorted = [...categoryPlayers].sort((a, b) => {
      if (a.seed && b.seed) return a.seed - b.seed;
      if (a.seed) return -1;
      if (b.seed) return 1;
      return 0;
    });
    return sorted;
  }, [categoryPlayers]);

  const filteredPlayers = useMemo(() => {
    return categoryPlayers
      .filter((p) => {
        if (activeTab === 'seeded') return p.seed != null && p.seed > 0;
        if (activeTab === 'unseeded') return p.seed == null;
        return true;
      })
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (a.seed && b.seed) return a.seed - b.seed;
        if (a.seed) return -1;
        if (b.seed) return 1;
        return 0;
      });
  }, [categoryPlayers, search, activeTab]);

  if (participants.length === 0) return null;

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface-1/40 p-5 shadow-sm backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-line/50 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="text-left">
            <h3 className="text-base font-bold tracking-tight text-ink">
              მონაწილეთა სია
            </h3>
            <p className="text-xs text-ink-2">
              სულ: <strong className="text-ink">{categoryPlayers.length}</strong>
              {seededCount > 0 && ` • ${seededCount} განთესილი`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-surface-2 p-1 text-xs font-semibold">
            <button
              onClick={() => setCategory('singles')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                category === 'singles'
                  ? 'bg-surface-1 text-ink shadow-xs'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              👤 ერთეულები
            </button>
            <button
              onClick={() => setCategory('doubles')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                category === 'doubles'
                  ? 'bg-surface-1 text-ink shadow-xs'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              👥 წყვილები
            </button>
          </div>
        </div>
      </div>

      {/* Preview grid — scrolls after PREVIEW_MAX_HEIGHT */}
      {previewPlayers.length > 0 ? (
        <div
          className="mt-4 overflow-y-auto pr-1"
          style={{ maxHeight: `${PREVIEW_MAX_HEIGHT}px` }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {previewPlayers.map((player) => (
              <div
                key={player.id}
                className="group relative flex items-center gap-3 rounded-xl border border-line/60 bg-surface-1 p-3 transition-all hover:border-accent/40 hover:shadow-md"
              >
                <div className="min-w-0 flex-1 text-left">
                  <MarqueeText className="text-sm font-semibold text-ink transition-colors group-hover:text-accent">
                    {player.name}
                  </MarqueeText>
                  {player.seed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent">
                      ★ Seed #{player.seed}
                    </span>
                  ) : (
                    <span className="text-[11px] text-ink-2">
                      {category === 'doubles' ? 'წყვილი' : 'მონაწილე'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-ink-2">
          ამ კატეგორიაში ჯერ არ არიან დარეგისტრირებული მონაწილეები
        </div>
      )}

      {/* Modal (unchanged) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-line bg-surface-1 p-6 shadow-2xl transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="text-left">
                <h3 className="text-lg font-bold text-ink">
                  {category === 'singles' ? 'ერთეულები' : 'წყვილები'} (
                  {categoryPlayers.length})
                </h3>
                <p className="text-xs text-ink-2">სრული სია და განთესვა</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="მოძებნე მოთამაშე..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface-2 py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <span className="absolute left-3.5 top-3 text-sm text-ink-2">🔍</span>
              </div>

              <div className="flex gap-1.5 rounded-xl bg-surface-2 p-1 text-xs font-semibold">
                {[
                  { id: 'all' as const, label: `ყველა (${categoryPlayers.length})` },
                  { id: 'seeded' as const, label: `განთესილები (${seededCount})` },
                  {
                    id: 'unseeded' as const,
                    label: `დანარჩენები (${categoryPlayers.length - seededCount})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 rounded-lg py-1.5 text-center transition-all ${
                      activeTab === tab.id
                        ? 'bg-surface-1 text-ink shadow-xs'
                        : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
              {filteredPlayers.length > 0 ? (
                filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 rounded-xl border border-line/50 bg-surface-2/40 p-3 text-left transition-colors hover:border-line hover:bg-surface-2"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                        player.seed
                          ? 'bg-gradient-to-br from-accent to-accent/80 text-white'
                          : 'bg-surface-3 text-ink'
                      }`}
                    >
                      {player.kind === 'doubles'
                        ? '👥'
                        : player.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <MarqueeText className="text-sm font-semibold text-ink">
                        {player.name}
                      </MarqueeText>
                      {player.seed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-accent">
                          ★ Seed #{player.seed}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-2">
                          {player.kind === 'doubles' ? 'წყვილი' : 'მონაწილე'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-ink-2">
                  <p className="mb-1 text-2xl">🔍</p>
                  <p className="text-sm font-medium">მოთამაშე ვერ მოიძებნა</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}