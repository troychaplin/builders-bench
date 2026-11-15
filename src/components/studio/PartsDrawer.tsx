'use client';

import { useEffect, useRef, useState, type Dispatch } from 'react';
import Link from 'next/link';
import { UserRound, X } from 'lucide-react';
import FigureIcon from '@/components/figures/FigureIcon';
import { getFaction } from '@/data/figureParts';
import { loadFigures } from '@/lib/figures/figure';
import { BRICK_CATEGORIES, BRICK_COLORS, BRICK_PARTS, getColor, getPart } from '@/data/brickCatalog';
import type { BlockFigure, BrickCategory, BrickFinish } from '@/types/brick';
import { BIN_KITS } from '@/lib/studio/bins';
import type { StudioAction, StudioState } from '@/lib/studio/reducer';
import PartThumb from './PartThumb';
import { inkOn, swatchStyle } from './Swatch';

export type DrawerTab = 'bins' | 'figures';

interface PartsDrawerProps {
  state: StudioState;
  dispatch: Dispatch<StudioAction>;
  onClose: () => void;
  initialTab?: DrawerTab;
}

const FINISHES: { id: BrickFinish; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'transparent', label: 'Transparent' },
  { id: 'metallic', label: 'Metallic' },
];

/** Modal catalog for loading parts and colors into the six BuildBins. */
export default function PartsDrawer({ state, dispatch, onClose, initialTab = 'bins' }: PartsDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>(initialTab);
  const [figures] = useState(loadFigures);
  const [target, setTarget] = useState(state.activeBin);
  const [category, setCategory] = useState<BrickCategory | 'all'>('all');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const bin = state.bins[target];
  const parts = category === 'all' ? BRICK_PARTS : BRICK_PARTS.filter((p) => p.category === category);

  function finish() {
    dispatch({ type: 'selectBin', index: target });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="parts-drawer-title"
        className="flex max-h-[92dvh] w-full max-w-4xl flex-col border border-ink/20 bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-ink/15 px-5 py-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-cobalt">PARTS DRAWER</p>
            <h2 id="parts-drawer-title" className="font-display text-xl font-bold tracking-tight">
              {tab === 'bins' ? 'Fill your BuildBins' : 'My Figures'}
            </h2>
          </div>
          <div role="tablist" aria-label="Drawer sections" className="ml-auto mr-3 flex border border-ink/15">
            {(['bins', 'figures'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-semibold ${tab === t ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'}`}
              >
                {t === 'bins' ? 'BuildBins' : `My Figures (${figures.length})`}
              </button>
            ))}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close parts drawer" className="p-1.5 text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-cobalt">
            <X className="h-5 w-5" />
          </button>
        </header>

        {tab === 'figures' ? (
          <FiguresPanel
            figures={figures}
            onPick={(f) => {
              dispatch({ type: 'pickFigure', figure: f });
              onClose();
            }}
          />
        ) : (
        <div className="grid flex-1 gap-0 overflow-y-auto md:grid-cols-[200px_1fr]">
          {/* Bin targets */}
          <aside className="border-b border-ink/15 p-4 md:border-b-0 md:border-r">
            <p className="mb-2 font-mono text-[10px] tracking-[0.18em] text-ink-soft">FILLING BIN</p>
            <div className="grid grid-cols-6 gap-1.5 md:grid-cols-2" role="radiogroup" aria-label="Bin to fill">
              {state.bins.map((b, i) => {
                const p = getPart(b.partId)!;
                const c = getColor(b.colorId)!;
                const selected = i === target;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`Bin ${i + 1}: ${c.name} ${p.name}`}
                    onClick={() => setTarget(i)}
                    className={`relative flex flex-col items-center gap-1 border px-1 pb-1.5 pt-4 ${
                      selected ? 'border-cobalt bg-cobalt/5' : 'border-ink/15 hover:border-ink/40'
                    }`}
                  >
                    <span className={`absolute left-1 top-1 font-mono text-[9px] font-semibold ${selected ? 'text-cobalt' : 'text-ink-faint'}`}>{i + 1}</span>
                    <span style={{ color: inkOn(c.hex) }}>
                      <PartThumb part={p} fill={c.hex} className="h-7 w-10" />
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              Bin {target + 1} holds <strong className="font-semibold text-ink">{getColor(bin.colorId)?.name} {getPart(bin.partId)?.name}</strong>.
            </p>
          </aside>

          <div className="space-y-6 p-4 sm:p-5">
            {/* Parts */}
            <section>
              <div className="mb-2 flex flex-wrap items-center gap-1" role="tablist" aria-label="Filter parts by category">
                {[{ id: 'all' as const, label: 'All' }, ...BRICK_CATEGORIES].map((c) => {
                  const active = c.id === category;
                  return (
                    <button
                      key={c.id}
                      role="tab"
                      type="button"
                      aria-selected={active}
                      onClick={() => setCategory(c.id)}
                      className={`border px-2 py-1 text-xs font-medium transition-colors ${
                        active ? 'border-ink bg-ink text-white' : 'border-ink/15 text-ink-soft hover:border-ink/40 hover:text-ink'
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
                {parts.map((p) => {
                  const selected = p.id === bin.partId;
                  const c = getColor(bin.colorId)!;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => dispatch({ type: 'setBin', index: target, bin: { partId: p.id } })}
                      className={`flex flex-col items-center gap-1.5 border px-1.5 pb-2 pt-3 text-center transition-colors ${
                        selected ? 'border-cobalt bg-cobalt/5' : 'border-ink/15 hover:border-ink/40'
                      }`}
                    >
                      <span style={{ color: inkOn(c.hex) }}>
                        <PartThumb part={p} fill={c.hex} className="h-9 w-14" />
                      </span>
                      <span className={`text-[11px] font-medium leading-tight ${selected ? 'text-cobalt' : 'text-ink'}`}>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Colors */}
            <section className="space-y-2">
              <p className="font-mono text-[10px] tracking-[0.18em] text-ink-soft">COLOR · {getColor(bin.colorId)?.name.toUpperCase()}</p>
              {FINISHES.map((f) => (
                <div key={f.id} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-[11px] text-ink-faint">{f.label}</span>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`${f.label} colors`}>
                    {BRICK_COLORS.filter((c) => c.finish === f.id).map((c) => {
                      const selected = c.id === bin.colorId;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          aria-label={c.name}
                          title={c.name}
                          onClick={() => dispatch({ type: 'setBin', index: target, bin: { colorId: c.id } })}
                          className={`h-6 w-6 rounded-sm border transition-transform hover:scale-110 ${
                            selected ? 'border-ink ring-2 ring-cobalt ring-offset-1' : 'border-ink/20'
                          }`}
                          style={swatchStyle(c)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>

            {/* Preset kits */}
            <section>
              <p className="mb-2 font-mono text-[10px] tracking-[0.18em] text-ink-soft">PRESET BIN KITS</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {BIN_KITS.map((kit) => (
                  <button
                    key={kit.id}
                    type="button"
                    onClick={() => {
                      dispatch({ type: 'loadBins', bins: kit.bins });
                      setTarget(0);
                    }}
                    className="group border border-ink/15 p-3 text-left transition-colors hover:border-cobalt"
                  >
                    <span className="flex gap-1" aria-hidden="true">
                      {kit.bins.map((b, i) => (
                        <span key={i} className="h-3 w-3 rounded-[2px] border border-ink/20" style={{ backgroundColor: getColor(b.colorId)?.hex }} />
                      ))}
                    </span>
                    <span className="mt-2 block text-sm font-semibold group-hover:text-cobalt">{kit.name}</span>
                    <span className="mt-0.5 block text-xs text-ink-soft">{kit.description}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        )}

        {tab === 'bins' && (
          <footer className="flex justify-end gap-2 border-t border-ink/15 px-5 py-3">
            <button type="button" onClick={finish} className="bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cobalt">
              Build with bin {target + 1}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

function FiguresPanel({ figures, onPick }: { figures: BlockFigure[]; onPick: (f: BlockFigure) => void }) {
  if (!figures.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
        <UserRound className="h-8 w-8 text-ink-faint" />
        <p className="max-w-sm text-sm text-ink-soft">No saved figures yet. Design a hero in the Figure Lab and save it to see it here.</p>
        <Link href="/figure-lab" className="bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-cobalt">
          Open Figure Lab
        </Link>
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5">
      <p className="mb-3 text-sm text-ink-soft">Pick a hero, then click the baseplate to place them. Press R to turn them.</p>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {figures.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => onPick(f)}
              className="flex w-full flex-col items-center gap-1 border border-ink/15 px-2 pb-2.5 pt-3 text-center transition-colors hover:border-cobalt"
            >
              <FigureIcon figure={f} size={56} />
              <span className="w-full truncate text-xs font-semibold">{f.name}</span>
              <span className="font-mono text-[9px] tracking-[0.14em]" style={{ color: getFaction(f.faction).hex }}>
                {getFaction(f.faction).name.toUpperCase()}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Link href="/figure-lab" className="mt-4 inline-block text-xs font-semibold text-ink-soft hover:text-cobalt">
        Design another hero in the Figure Lab →
      </Link>
    </div>
  );
}
