import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import BlueprintPreview from '@/components/BlueprintPreview';
import ModeCard from '@/components/ModeCard';
import { BRICK_COLORS, BRICK_PARTS } from '@/data/brickCatalog';
import { APP_MODES } from '@/data/modes';

const SHEET_META = ['SHEET A-01', 'SCALE 1:1', 'STUD GRID 24×24', 'REV 1.0'];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      {/* Sheet header metadata */}
      <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] tracking-[0.18em] text-ink-soft">
        <span className="text-cobalt">+</span>
        {SHEET_META.map((m, i) => (
          <span key={m} className="flex items-center gap-6">
            {m}
            {i < SHEET_META.length - 1 && <span className="h-3 w-px bg-ink/20" aria-hidden="true" />}
          </span>
        ))}
      </div>

      {/* Hero */}
      <section className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div className="reg-marks border border-ink/15 bg-white/70 p-7 backdrop-blur-[2px] sm:p-10">
          <span className="reg reg-tl" /><span className="reg reg-tr" />
          <span className="reg reg-bl" /><span className="reg reg-br" />

          <p className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.2em] text-cobalt">
            <span className="h-1.5 w-1.5 bg-signal-red" aria-hidden="true" />
            MASTER BUILDER BLUEPRINT
          </p>

          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-6xl">
            Design, Snap
            <br />& Engineer
            <br />
            <span className="text-cobalt">in 3D.</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft">
            A precision workbench for brick builders. Lay out models on a true stud grid, follow
            guided kits, prototype figures, and explore the set archive.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/studio"
              className="group inline-flex items-center gap-2.5 bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            >
              Launch 3D Workbench
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/kits" className="text-sm font-medium text-ink-soft underline-offset-4 hover:text-ink hover:underline">
              Browse guided kits
            </Link>
          </div>

          <dl className="mt-10 grid grid-cols-3 border-t border-ink/15 pt-5">
            {[
              { label: 'PARTS', value: BRICK_PARTS.length },
              { label: 'COLORS', value: BRICK_COLORS.length },
              { label: 'MODULES', value: APP_MODES.length },
            ].map((s, i) => (
              <div key={s.label} className={i > 0 ? 'border-l border-ink/15 pl-4' : ''}>
                <dt className="font-mono text-[10px] tracking-[0.18em] text-ink-soft">{s.label}</dt>
                <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <BlueprintPreview />
      </section>

      {/* Modules */}
      <section className="mt-24">
        <div className="mb-8 flex items-end justify-between gap-4 border-b border-ink/15 pb-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-cobalt">SECTION 02</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Studio Modules</h2>
          </div>
          <span className="hidden font-mono text-[10px] tracking-[0.18em] text-ink-soft sm:block">
            {APP_MODES.length} MODULES · {APP_MODES.filter((m) => m.status === 'active').length} ACTIVE
          </span>
        </div>
        <div className="grid gap-px border border-ink/15 bg-ink/15 sm:grid-cols-2">
          {APP_MODES.map((mode) => (
            <ModeCard key={mode.href} mode={mode} />
          ))}
        </div>
      </section>
    </div>
  );
}
