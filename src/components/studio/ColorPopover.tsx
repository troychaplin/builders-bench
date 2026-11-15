'use client';

import type { Dispatch } from 'react';
import { BRICK_COLORS, getColor } from '@/data/brickCatalog';
import type { BrickColor, BrickFinish } from '@/types/brick';
import type { StudioAction, StudioState } from '@/lib/studio/reducer';
import { swatchStyle } from './Swatch';

const FINISHES: { id: BrickFinish; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'transparent', label: 'Transparent' },
  { id: 'metallic', label: 'Metallic' },
];

/** Brick colour picker: recent colours, then every colour grouped by finish. */
export default function ColorPopover({
  state,
  dispatch,
  onPicked,
}: {
  state: StudioState;
  dispatch: Dispatch<StudioAction>;
  onPicked: () => void;
}) {
  const { colorId, recentColors } = state.palette;
  const current = getColor(colorId);
  const recents = recentColors.map((id) => getColor(id)).filter((c): c is BrickColor => !!c);

  function pick(id: string) {
    dispatch({ type: 'setColor', colorId: id });
    onPicked();
  }

  return (
    <div className="space-y-3 p-3">
      {current && (
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-sm border border-ink/20" style={swatchStyle(current)} aria-hidden="true" />
          <span className="text-sm font-semibold">{current.name}</span>
          <span className="ml-auto font-mono text-[10px] uppercase text-ink-faint">{current.finish}</span>
        </div>
      )}
      {recents.length > 0 && (
        <section>
          <p className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-ink-faint">RECENT</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Recent colours">
            {recents.map((c) => (
              <ColorSwatch key={c.id} c={c} selected={c.id === colorId} onPick={pick} />
            ))}
          </div>
        </section>
      )}
      {FINISHES.map((f) => (
        <section key={f.id}>
          <p className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-ink-faint">{f.label.toUpperCase()}</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`${f.label} colours`}>
            {BRICK_COLORS.filter((c) => c.finish === f.id).map((c) => (
              <ColorSwatch key={c.id} c={c} selected={c.id === colorId} onPick={pick} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ColorSwatch({ c, selected, onPick }: { c: BrickColor; selected: boolean; onPick: (id: string) => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={c.name}
      title={c.name}
      onClick={() => onPick(c.id)}
      className={`h-7 w-7 rounded-sm border transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt ${
        selected ? 'border-ink ring-2 ring-cobalt ring-offset-1' : 'border-ink/20'
      }`}
      style={swatchStyle(c)}
    />
  );
}
