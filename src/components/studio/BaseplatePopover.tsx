'use client';

import type { Dispatch } from 'react';
import { BASEPLATE_COLORS, BASEPLATE_SIZES, getBaseplateColor } from '@/lib/studio/constants';
import { canResizeTo, type StudioAction, type StudioState } from '@/lib/studio/reducer';

/** Baseplate size and colour. */
export default function BaseplatePopover({ state, dispatch }: { state: StudioState; dispatch: Dispatch<StudioAction> }) {
  const { project } = state;
  const plate = getBaseplateColor(project.baseplateColor);

  return (
    <div className="space-y-4 p-3">
      <section>
        <p className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-ink-faint">SIZE (STUDS)</p>
        <div className="grid grid-cols-5 gap-1" role="radiogroup" aria-label="Baseplate size">
          {BASEPLATE_SIZES.map((size) => {
            const selected = size === project.baseplateSize;
            const fits = selected || canResizeTo(project, size);
            return (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={!fits}
                title={fits ? `${size}×${size} studs` : `${size}×${size}: the build is too big`}
                onClick={() => dispatch({ type: 'setBaseplateSize', size })}
                className={`h-8 border font-mono text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                  selected ? 'border-ink bg-ink text-white' : 'border-ink/15 text-ink-soft hover:border-ink/40 hover:text-ink'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-ink-soft">Resizing keeps your build centred. Sizes too small for it are disabled.</p>
      </section>

      <section>
        <p className="mb-1.5 font-mono text-[9px] tracking-[0.18em] text-ink-faint">COLOUR · {plate.name.toUpperCase()}</p>
        <div className="grid grid-cols-6 justify-items-start gap-2" role="radiogroup" aria-label="Baseplate colour">
          {BASEPLATE_COLORS.map((c) => {
            const selected = c.id === plate.id;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${c.name} baseplate`}
                title={c.name}
                onClick={() => dispatch({ type: 'setBaseplateColor', colorId: c.id })}
                className={`h-7 w-7 rounded-full border transition-transform hover:scale-110 ${
                  selected ? 'border-ink ring-2 ring-cobalt ring-offset-1' : 'border-ink/25'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
