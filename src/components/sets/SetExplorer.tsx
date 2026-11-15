'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Heart, RotateCcw, Scale, Search, X } from 'lucide-react';
import type { BrickSet, SetQuery, SetSort } from '@/types/set';
import { MIN_YEAR, PAGE_SIZE, PIECE_STOPS, SET_THEMES, filterSets, maxYear, parseQuery, pieceStopLabel, queryToParams } from '@/lib/sets/query';
import { loadWishlist, mergeWishlists, saveWishlist } from '@/lib/sets/wishlist';
import RangeSlider from './RangeSlider';
import { SetImage, ThemeBadge, fmt } from './SetBits';
import { CompareModal, SetDetailModal, WishlistPanel } from './SetModals';

const LAST_STOP = PIECE_STOPS.length - 1;
const MAX_COMPARE = 3;

const SORT_OPTIONS: { id: SetSort; label: string }[] = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'pieces-desc', label: 'Most pieces' },
  { id: 'pieces-asc', label: 'Fewest pieces' },
  { id: 'name', label: 'Name A–Z' },
];

interface Filters {
  search: string;
  theme: string;
  years: [number, number];
  pieces: [number, number]; // indices into PIECE_STOPS
  sort: SetSort;
}

function stopIndex(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const i = PIECE_STOPS.findIndex((s) => s >= value);
  return i === -1 ? LAST_STOP : i;
}

function initialFilters(): Filters {
  const q = parseQuery(new URLSearchParams(window.location.search));
  const top = maxYear();
  return {
    search: q.search ?? '',
    theme: q.theme ?? '',
    years: [Math.max(MIN_YEAR, q.minYear ?? MIN_YEAR), Math.min(top, q.maxYear ?? top)],
    pieces: [stopIndex(q.minPieces, 0), q.maxPieces === undefined ? LAST_STOP : stopIndex(q.maxPieces, LAST_STOP)],
    sort: q.sort ?? 'newest',
  };
}

function toQuery(f: Filters, top: number): SetQuery {
  return {
    search: f.search || undefined,
    theme: f.theme || undefined,
    minYear: f.years[0] > MIN_YEAR ? f.years[0] : undefined,
    maxYear: f.years[1] < top ? f.years[1] : undefined,
    minPieces: f.pieces[0] > 0 ? PIECE_STOPS[f.pieces[0]] : undefined,
    maxPieces: f.pieces[1] < LAST_STOP ? PIECE_STOPS[f.pieces[1]] : undefined,
    sort: f.sort,
  };
}

export default function SetExplorer() {
  const [top] = useState(maxYear);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [page, setPage] = useState(1);

  const [wishlist, setWishlist] = useState<BrickSet[]>(loadWishlist);
  const [compare, setCompare] = useState<BrickSet[]>([]);
  const [detail, setDetail] = useState<BrickSet | null>(null);
  const [panel, setPanel] = useState<'compare' | 'wishlist' | null>(null);

  const query = useMemo(() => toQuery(filters, top), [filters, top]);
  const key = useMemo(() => queryToParams(query).toString(), [query]);
  // Filtering 76 sets is instant, so results are derived directly from the filters.
  const matches = useMemo(() => filterSets(query), [query]);
  const items = matches.slice(0, page * PAGE_SIZE);
  const hasMore = items.length < matches.length;

  const update = useCallback((patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }, []);

  // Debounce typing into the search filter.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = searchInput.trim();
      setFilters((f) => (f.search === next ? f : { ...f, search: next }));
      setPage(1);
    }, 220);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // Keep the URL shareable.
  useEffect(() => {
    window.history.replaceState(null, '', `/sets${key ? `?${key}` : ''}`);
  }, [key]);

  useEffect(() => saveWishlist(wishlist), [wishlist]);

  const wished = (s: BrickSet) => wishlist.some((w) => w.setNum === s.setNum);
  const comparing = (s: BrickSet) => compare.some((c) => c.setNum === s.setNum);

  const toggleWish = (s: BrickSet) =>
    setWishlist((list) => (list.some((w) => w.setNum === s.setNum) ? list.filter((w) => w.setNum !== s.setNum) : [...list, s]));

  const toggleCompare = (s: BrickSet) =>
    setCompare((list) => {
      if (list.some((c) => c.setNum === s.setNum)) return list.filter((c) => c.setNum !== s.setNum);
      return list.length >= MAX_COMPARE ? list : [...list, s];
    });

  const closePanel = useCallback(() => setPanel(null), []);
  const closeDetail = useCallback(() => setDetail(null), []);

  function reset() {
    setSearchInput('');
    update({ search: '', theme: '', years: [MIN_YEAR, top], pieces: [0, LAST_STOP], sort: 'newest' });
  }

  const wishPieces = wishlist.reduce((n, s) => n + s.pieces, 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-ink/15 pb-6">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-cobalt">MOD // 04 — SET EXPLORER</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Brick Set Encyclopedia</h1>
          <p className="mt-2 max-w-xl text-ink-soft">Search decades of sets by name or number, compare them side by side, and build your dream list.</p>
        </div>
        <button
          type="button"
          onClick={() => setPanel('wishlist')}
          className="inline-flex items-center gap-3 border border-ink/20 bg-white px-4 py-2.5 text-left transition-colors hover:border-signal-red"
        >
          <Heart className={`h-5 w-5 ${wishlist.length ? 'fill-signal-red text-signal-red' : 'text-ink-soft'}`} />
          <span>
            <span className="block text-sm font-semibold">Dream Set Wish List</span>
            <span className="block font-mono text-[10px] tracking-[0.12em] text-ink-soft">
              {wishlist.length} SETS · {fmt(wishPieces)} BRICKS
            </span>
          </span>
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters */}
        <aside className="h-fit space-y-6 border border-ink/15 bg-white/90 p-4 lg:sticky lg:top-20">
          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.18em] text-ink-soft">SEARCH</span>
            <span className="relative mt-1 block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Name or set no., e.g. 75192"
                className="w-full border border-ink/15 bg-white py-2 pl-8 pr-2 text-sm outline-none focus:border-cobalt"
              />
            </span>
          </label>

          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.18em] text-ink-soft">THEME</span>
            <select
              value={filters.theme}
              onChange={(e) => update({ theme: e.target.value })}
              className="mt-1 w-full border border-ink/15 bg-white px-2 py-2 text-sm outline-none focus:border-cobalt"
            >
              <option value="">All themes</option>
              {SET_THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <RangeSlider
            label="RELEASE YEAR"
            min={MIN_YEAR}
            max={top}
            value={filters.years}
            onChange={(years) => update({ years })}
            format={(v) => String(v)}
            thumbLabels={['Earliest year', 'Latest year']}
          />

          <RangeSlider
            label="PIECE COUNT"
            min={0}
            max={LAST_STOP}
            value={filters.pieces}
            onChange={(pieces) => update({ pieces })}
            format={(i) => (i === 0 ? '<200' : pieceStopLabel(i))}
            thumbLabels={['Minimum pieces', 'Maximum pieces']}
          />

          <label className="block">
            <span className="font-mono text-[10px] tracking-[0.18em] text-ink-soft">SORT</span>
            <select
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as SetSort })}
              className="mt-1 w-full border border-ink/15 bg-white px-2 py-2 text-sm outline-none focus:border-cobalt"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink">
            <RotateCcw className="h-3.5 w-3.5" /> Reset filters
          </button>
        </aside>

        {/* Results */}
        <section aria-labelledby="results-heading">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="results-heading" className="font-mono text-[11px] tracking-[0.14em] text-ink-soft" aria-live="polite">
              <span className="text-ink">{fmt(matches.length)}</span> {matches.length === 1 ? 'SET' : 'SETS'} · FEATURED COLLECTION
            </h2>
            <p className="text-[11px] text-ink-faint">
              Set data and thumbnails indexed via{' '}
              <a href="https://rebrickable.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-cobalt">
                Rebrickable
              </a>
            </p>
          </div>

          {items.length === 0 ? (
            <div className="border border-dashed border-ink/20 bg-white/70 p-10 text-center">
              <p className="text-sm text-ink-soft">No sets match those filters.</p>
              <button type="button" onClick={reset} className="mt-3 text-sm font-semibold text-cobalt hover:underline">
                Reset filters
              </button>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-px border border-ink/15 bg-ink/15 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((s) => (
                <li key={s.setNum} className="group relative flex flex-col bg-white">
                  <button type="button" onClick={() => setDetail(s)} className="flex flex-1 flex-col text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt">
                    <span className="relative block aspect-[4/3] border-b border-ink/10">
                      <SetImage set={s} sizes="(min-width: 1280px) 220px, (min-width: 640px) 30vw, 50vw" />
                    </span>
                    <span className="flex flex-1 flex-col gap-1.5 p-3">
                      <ThemeBadge set={s} />
                      <span className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-cobalt">{s.name}</span>
                      <span className="mt-auto font-mono text-[10px] tracking-[0.1em] text-ink-soft">
                        {s.setNum} · {s.year} · {fmt(s.pieces)} PCS
                      </span>
                    </span>
                  </button>
                  <div className="absolute right-1.5 top-1.5 flex gap-1">
                    <button
                      type="button"
                      onClick={() => toggleCompare(s)}
                      disabled={!comparing(s) && compare.length >= MAX_COMPARE}
                      aria-pressed={comparing(s)}
                      aria-label={`${comparing(s) ? 'Remove' : 'Add'} ${s.name} ${comparing(s) ? 'from' : 'to'} comparison`}
                      title={!comparing(s) && compare.length >= MAX_COMPARE ? 'Compare holds up to 3 sets' : 'Compare'}
                      className={`border p-1.5 backdrop-blur transition-colors disabled:opacity-30 ${
                        comparing(s) ? 'border-cobalt bg-cobalt text-white' : 'border-ink/15 bg-white/90 text-ink-soft hover:text-cobalt'
                      }`}
                    >
                      <Scale className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWish(s)}
                      aria-pressed={wished(s)}
                      aria-label={`${wished(s) ? 'Remove' : 'Add'} ${s.name} ${wished(s) ? 'from' : 'to'} wish list`}
                      className={`border p-1.5 backdrop-blur transition-colors ${
                        wished(s) ? 'border-signal-red bg-signal-red text-white' : 'border-ink/15 bg-white/90 text-ink-soft hover:text-signal-red'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${wished(s) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="border border-ink/20 bg-white px-5 py-2.5 text-sm font-semibold hover:border-cobalt hover:text-cobalt"
              >
                Load more sets
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Compare tray */}
      {compare.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-3">
          <div className="flex w-full max-w-xl items-center gap-3 border border-ink/20 bg-white/95 p-2 shadow-xl backdrop-blur">
            <div className="flex min-w-0 flex-1 gap-2">
              {compare.map((s) => (
                <div key={s.setNum} className="relative h-12 w-16 shrink-0 border border-ink/10 bg-white" title={s.name}>
                  <SetImage set={s} sizes="64px" />
                  <button
                    type="button"
                    onClick={() => toggleCompare(s)}
                    aria-label={`Remove ${s.name} from comparison`}
                    className="absolute -right-1.5 -top-1.5 rounded-full border border-ink/20 bg-white p-0.5 text-ink-soft hover:text-signal-red"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {Array.from({ length: MAX_COMPARE - compare.length }, (_, i) => (
                <div key={i} className="hidden h-12 w-16 shrink-0 border border-dashed border-ink/20 sm:block" aria-hidden="true" />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPanel('compare')}
              className="inline-flex shrink-0 items-center gap-1.5 bg-cobalt px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Scale className="h-4 w-4" /> Compare {compare.length}/{MAX_COMPARE}
            </button>
          </div>
        </div>
      )}

      {detail && (
        <SetDetailModal
          set={detail}
          wished={wished(detail)}
          comparing={comparing(detail)}
          compareFull={compare.length >= MAX_COMPARE}
          onToggleWish={() => toggleWish(detail)}
          onToggleCompare={() => toggleCompare(detail)}
          onClose={closeDetail}
        />
      )}
      {panel === 'compare' && compare.length > 0 && (
        <CompareModal sets={compare} onRemove={toggleCompare} onClose={closePanel} />
      )}
      {panel === 'wishlist' && (
        <WishlistPanel
          list={wishlist}
          onRemove={toggleWish}
          onOpen={(s) => {
            setPanel(null);
            setDetail(s);
          }}
          onImport={(sets) => setWishlist((list) => mergeWishlists(list, sets))}
          onClose={closePanel}
        />
      )}
    </div>
  );
}
