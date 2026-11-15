'use client';

import type { Dispatch } from 'react';
import { Plus, UserRound } from 'lucide-react';
import { BRICK_COLORS, getColor, getPart } from '@/data/brickCatalog';
import type { StudioAction, StudioState } from '@/lib/studio/reducer';
import PartThumb from './PartThumb';
import { inkOn, swatchStyle } from './Swatch';

interface BinsHudProps {
  state: StudioState;
  dispatch: Dispatch<StudioAction>;
  onOpenDrawer: () => void;
  onOpenFigures: () => void;
}

/** Bottom quick-access BuildBins plus the color swatch bar. */
export default function BinsHud({ state, dispatch, onOpenDrawer, onOpenFigures }: BinsHudProps) {
  const { bins, activeBin, tool } = state;
  const activeColorId = bins[activeBin].colorId;

  return (
    <div className="w-full max-w-3xl border border-ink/15 bg-white/95 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex items-stretch gap-1.5 overflow-x-auto p-1.5" role="radiogroup" aria-label="BuildBins">
        {bins.map((bin, i) => {
          const part = getPart(bin.partId)!;
          const color = getColor(bin.colorId)!;
          const selected = i === activeBin && tool === 'place';
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`Bin ${i + 1}: ${color.name} ${part.name}`}
              title={`${part.name} · ${color.name} (${i + 1})`}
              onClick={() => dispatch({ type: 'selectBin', index: i })}
              className={`relative flex min-w-[68px] flex-1 flex-col items-center gap-1 border px-1.5 pb-1.5 pt-4 transition-colors ${
                selected ? 'border-cobalt bg-cobalt/5' : 'border-ink/15 bg-slate-50/60 hover:border-ink/40'
              }`}
            >
              <span
                className={`absolute left-1 top-1 font-mono text-[9px] font-semibold ${selected ? 'text-cobalt' : 'text-ink-faint'}`}
              >
                {i + 1}
              </span>
              <span style={{ color: inkOn(color.hex) }}>
                <PartThumb part={part} fill={color.hex} className="h-8 w-12" />
              </span>
              <span className="w-full truncate text-center text-[10px] font-medium leading-tight text-ink-soft">
                {part.name.replace(/^(Brick|Plate|Tile|Slope) /, '')}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex min-w-[84px] flex-col items-center justify-center gap-1 border border-dashed border-ink/30 px-2 text-[11px] font-semibold text-ink-soft transition-colors hover:border-cobalt hover:text-cobalt"
        >
          <Plus className="h-4 w-4" />
          Fill BuildBins
        </button>
        <button
          type="button"
          onClick={onOpenFigures}
          aria-pressed={tool === 'figure'}
          className={`flex min-w-[84px] flex-col items-center justify-center gap-1 border px-2 text-[11px] font-semibold transition-colors ${
            tool === 'figure' ? 'border-cyan bg-cyan/10 text-cyan' : 'border-ink/15 text-ink-soft hover:border-cobalt hover:text-cobalt'
          }`}
        >
          <UserRound className="h-4 w-4" />
          {tool === 'figure' && state.placingFigure ? <span className="max-w-[80px] truncate">{state.placingFigure.name}</span> : 'My Figures'}
        </button>
      </div>

      <div className="flex items-center gap-2 border-t border-ink/10 px-2 py-1.5">
        <span className="shrink-0 font-mono text-[9px] tracking-[0.18em] text-ink-faint">COLOR</span>
        <div className="flex gap-1 overflow-x-auto py-0.5" role="radiogroup" aria-label="Brick color">
          {BRICK_COLORS.map((c) => {
            const selected = c.id === activeColorId;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={c.name}
                title={c.name}
                onClick={() => dispatch({ type: 'setColor', colorId: c.id })}
                className={`h-5 w-5 shrink-0 rounded-sm border transition-transform hover:scale-110 ${
                  selected ? 'border-ink ring-2 ring-cobalt ring-offset-1' : 'border-ink/20'
                }`}
                style={swatchStyle(c)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
