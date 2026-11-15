'use client';

import type { Dispatch } from 'react';
import { BASEPLATE_COLORS, BASEPLATE_SIZES, getBaseplateColor } from '@/lib/studio/constants';
import { SECTION_LABEL, chip } from './controls';
import { canResizeTo, type StudioAction, type StudioState } from '@/lib/studio/reducer';

/** Baseplate size and colour. */
export default function BaseplatePopover({ state, dispatch }: { state: StudioState; dispatch: Dispatch<StudioAction> }) {
  const { project } = state;
  const plate = getBaseplateColor(project.baseplateColor);

  return (
    <div className="space-y-5 p-4">
      <section>
        <p className={SECTION_LABEL}>SIZE (STUDS)</p>
        <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Baseplate size">
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
                className={`h-9 font-mono text-[11px] ${chip(selected)}`}
              >
                {size}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">Resizing keeps your build centred. Sizes too small for it are disabled.</p>
      </section>

      <section>
        <p className={SECTION_LABEL}>COLOUR · {plate.name.toUpperCase()}</p>
        <div className="grid grid-cols-6 justify-items-start gap-2.5" role="radiogroup" aria-label="Baseplate colour">
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
                  selected ? 'border-cobalt ring-2 ring-cobalt/40 ring-offset-1' : 'border-ink/25 hover:border-ink/50'
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
