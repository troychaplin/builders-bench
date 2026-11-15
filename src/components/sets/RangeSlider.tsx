'use client';

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  format: (v: number) => string;
  /** Accessible names for the two thumbs. */
  thumbLabels: [string, string];
}

/** Dual-thumb range built from two native range inputs (keyboard + screen reader friendly). */
export default function RangeSlider({ label, min, max, step = 1, value, onChange, format, thumbLabels }: RangeSliderProps) {
  const [lo, hi] = value;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] tracking-[0.18em] text-ink-soft">{label}</span>
        <span className="font-mono text-xs font-semibold text-ink">
          {format(lo)} – {format(hi)}
        </span>
      </div>
      <div className="dual-range relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-slate-200" aria-hidden="true" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 bg-cobalt"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
          aria-hidden="true"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          aria-label={thumbLabels[0]}
          aria-valuetext={format(lo)}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
          style={{ zIndex: lo > max - (max - min) * 0.1 ? 4 : 3 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          aria-label={thumbLabels[1]}
          aria-valuetext={format(hi)}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
          style={{ zIndex: 3 }}
        />
      </div>
    </div>
  );
}
