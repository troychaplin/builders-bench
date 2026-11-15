'use client';

import { useState, type Dispatch } from 'react';
import { Search } from 'lucide-react';
import { BRICK_CATEGORIES, BRICK_PARTS, getColor, getPart } from '@/data/brickCatalog';
import type { BrickCategory, BrickPart } from '@/types/brick';
import type { StudioAction, StudioState } from '@/lib/studio/reducer';
import PartThumb from './PartThumb';
import { inkOn } from './Swatch';

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
    <div className="space-y-3 p-3">
      <label className="flex items-center gap-2 border border-ink/15 bg-white px-2 focus-within:border-cobalt">
        <Search className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
        <span className="sr-only">Search blocks</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search blocks (e.g. slope, 2x4)"
          className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
      </label>

      {!q && recents.length > 0 && (
        <section>
          <p className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-ink-faint">RECENT · KEYS 1–{recents.length}</p>
          <div className="grid grid-cols-6 gap-1">
            {recents.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pick(p.id)}
                aria-label={`${p.name} (${i + 1})`}
                title={`${p.name} (${i + 1})`}
                aria-pressed={placing && p.id === partId}
                className={`relative flex aspect-square items-center justify-center border transition-colors ${
                  placing && p.id === partId ? 'border-cobalt bg-cobalt/5' : 'border-ink/15 hover:border-ink/40'
                }`}
              >
                <span className="absolute left-0.5 top-0 font-mono text-[8px] text-ink-faint">{i + 1}</span>
                <span style={{ color: inkOn(fill) }}>
                  <PartThumb part={p} fill={fill} className="h-5 w-8" />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Block categories">
        {[{ id: 'all' as const, label: 'All' }, ...BRICK_CATEGORIES].map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={c.id === category}
            onClick={() => setCategory(c.id)}
            className={`border px-2 py-0.5 text-[11px] font-medium transition-colors ${
              c.id === category ? 'border-ink bg-ink text-white' : 'border-ink/15 text-ink-soft hover:border-ink/40 hover:text-ink'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {parts.length ? (
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-3">
          {parts.map((p) => {
            const selected = placing && p.id === partId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => pick(p.id)}
                aria-pressed={selected}
                className={`flex flex-col items-center gap-1 border px-1 pb-1.5 pt-2.5 text-center transition-colors ${
                  selected ? 'border-cobalt bg-cobalt/5' : 'border-ink/15 hover:border-ink/40'
                }`}
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
