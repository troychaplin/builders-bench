'use client';

import { useState, type Dispatch } from 'react';
import Link from 'next/link';
import { UserRound } from 'lucide-react';
import FigureIcon from '@/components/figures/FigureIcon';
import { getFaction } from '@/data/figureParts';
import { loadFigures } from '@/lib/figures/figure';
import { tile } from './controls';
import type { StudioAction, StudioState } from '@/lib/studio/reducer';

/** Saved Figure Lab heroes, ready to place on the baseplate. */
export default function FiguresPanel({
  state,
  dispatch,
  onPicked,
}: {
  state: StudioState;
  dispatch: Dispatch<StudioAction>;
  onPicked: () => void;
}) {
  const [figures] = useState(loadFigures);
  const placingId = state.tool === 'figure' ? state.placingFigure?.id : undefined;

  if (!figures.length) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <UserRound className="h-7 w-7 text-ink-faint" />
        <p className="text-sm text-ink-soft">No saved figures yet. Design a hero in the Figure Lab and save it to see it here.</p>
        <Link href="/figure-lab" className="bg-cobalt px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
          Open Figure Lab
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <p className="mb-3 text-xs leading-relaxed text-ink-soft">Pick a hero, then click the baseplate to place them. Press R to turn them.</p>
      <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {figures.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              aria-pressed={f.id === placingId}
              onClick={() => {
                dispatch({ type: 'pickFigure', figure: f });
                onPicked();
              }}
              className={`flex w-full flex-col items-center gap-1 px-1.5 pb-2 pt-3 text-center ${tile(f.id === placingId)}`}
            >
              <FigureIcon figure={f} size={44} />
              <span className="w-full truncate text-[11px] font-semibold">{f.name}</span>
              <span className="font-mono text-[8px] tracking-[0.14em]" style={{ color: getFaction(f.faction).hex }}>
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
