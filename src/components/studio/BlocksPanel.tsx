'use client';

import { useState, type Dispatch } from 'react';
import { Search } from 'lucide-react';
import { BRICK_CATEGORIES, BRICK_PARTS, getColor, getPart } from '@/data/brickCatalog';
import type { BrickCategory, BrickPart } from '@/types/brick';
import type { StudioAction, StudioState } from '@/lib/studio/reducer';
import PartThumb from './PartThumb';
import { inkOn } from './Swatch';
import { SECTION_LABEL, chip, tile } from './controls';

/** Browse every block by category or search, with the most recently used ones up top. */
export default function BlocksPanel({
  state,
  dispatch,
  onPicked,
}: {
  state: StudioState;
  dispatch: Dispatch<StudioAction>;
  onPicked: () => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<BrickCategory | 'all'>('all');
  const { partId, colorId, recentParts } = state.palette;
  const fill = getColor(colorId)?.hex ?? '#ffffff';
  const placing = state.tool === 'place';

  const q = query.trim().toLowerCase().replace(/x/g, '×');
  const parts = BRICK_PARTS.filter(
    (p) => (category === 'all' || p.category === category) && (!q || `${p.name} ${p.category}`.toLowerCase().includes(q)),
  );
  const recents = recentParts.map((id) => getPart(id)).filter((p): p is BrickPart => !!p);

  function pick(id: string) {
    dispatch({ type: 'selectPart', partId: id });
    onPicked();
  }

  return (
    <div className="space-y-4 p-4">
      <label className="flex items-center gap-2 border border-ink/15 bg-white px-2.5 transition-colors focus-within:border-cobalt hover:border-ink/30">
        <Search className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
        <span className="sr-only">Search blocks</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search blocks (e.g. slope, 2x4)"
          className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
      </label>

      {!q && recents.length > 0 && (
        <section>
          <p className={SECTION_LABEL}>RECENT · KEYS 1–{recents.length}</p>
          <div className="grid grid-cols-6 gap-1.5">
            {recents.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pick(p.id)}
                aria-label={`${p.name} (${i + 1})`}
                title={`${p.name} (${i + 1})`}
                aria-pressed={placing && p.id === partId}
                className={`relative flex aspect-square items-center justify-center ${tile(placing && p.id === partId)}`}
              >
                <span className="absolute left-1 top-0.5 font-mono text-[8px] leading-none text-ink-faint">{i + 1}</span>
                <span style={{ color: inkOn(fill) }}>
                  <PartThumb part={p} fill={fill} className="h-5 w-8" />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Block categories">
        {[{ id: 'all' as const, label: 'All' }, ...BRICK_CATEGORIES].map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={c.id === category}
            onClick={() => setCategory(c.id)}
            className={`px-2.5 py-1 text-[11px] font-medium ${chip(c.id === category)}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {parts.length ? (
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {parts.map((p) => {
            const selected = placing && p.id === partId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pick(p.id)}
                aria-pressed={selected}
                className={`flex flex-col items-center gap-1.5 px-1.5 pb-2 pt-3 text-center ${tile(selected)}`}
              >
                <span style={{ color: inkOn(fill) }}>
                  <PartThumb part={p} fill={fill} className="h-8 w-12" />
                </span>
                <span className={`text-[10px] font-medium leading-tight ${selected ? 'text-cobalt' : 'text-ink'}`}>{p.name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="py-6 text-center text-xs text-ink-soft">No blocks match “{query}”.</p>
      )}
    </div>
  );
}
