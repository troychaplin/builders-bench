import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Blocks } from 'lucide-react';
import KitThumbnail from '@/components/kits/KitThumbnail';
import { BadgeShelf, CartridgeLauncher, EarnedMark } from '@/components/kits/KitsIndexClient';
import { getColor } from '@/data/brickCatalog';
import { DIFFICULTY_LABEL, STARTER_KITS, type KitDifficulty } from '@/data/starterKits';
import { buildSteps } from '@/lib/kits/steps';

export const metadata: Metadata = {
  title: 'Guided Kits',
  description: 'Assemble micro-kits step by step, or turn your own studio creation into a guided kit.',
};

const DIFFICULTY_STYLE: Record<KitDifficulty, string> = {
  beginner: 'border-emerald/40 bg-emerald/10 text-emerald-700',
  intermediate: 'border-cobalt/30 bg-cobalt/10 text-cobalt',
  master: 'border-signal-red/30 bg-signal-red/10 text-red-700',
};

export default function KitsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10 border-b border-ink/15 pb-6">
        <p className="font-mono text-[10px] tracking-[0.2em] text-cobalt">MOD // 02 — GUIDED KITS</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Micro-Kit Library</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Build piece by piece from the bottom up. Each step glows on the baseplate as a hologram—snap the pieces in,
          then finish the kit to earn a Master Builder Badge.
        </p>
      </header>

      <section aria-labelledby="kits-heading">
        <h2 id="kits-heading" className="sr-only">
          Starter kits
        </h2>
        <div className="grid gap-px border border-ink/15 bg-ink/15 sm:grid-cols-2 lg:grid-cols-4">
          {STARTER_KITS.map((kit, i) => {
            const steps = buildSteps(kit.project.bricks).length;
            const palette = [...new Set(kit.project.bricks.map((b) => b.colorId))].slice(0, 6);
            return (
              <Link
                key={kit.slug}
                href={`/kits/${kit.slug}`}
                className="group flex flex-col bg-white p-5 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt"
              >
                <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.16em] text-ink-soft">
                  <span>KIT // {String(i + 1).padStart(2, '0')}</span>
                  <span className={`border px-1.5 py-0.5 font-semibold ${DIFFICULTY_STYLE[kit.difficulty]}`}>
                    {DIFFICULTY_LABEL[kit.difficulty].toUpperCase()}
                  </span>
                </div>
                <div className="my-5 flex h-36 items-center justify-center">
                  <KitThumbnail bricks={kit.project.bricks} className="h-full w-auto max-w-full transition-transform duration-300 group-hover:-translate-y-1" />
                </div>
                <h3 className="font-display text-xl font-bold tracking-tight group-hover:text-cobalt">{kit.project.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{kit.tagline}</p>
                <div className="mt-4 flex items-center gap-1" aria-hidden="true">
                  {palette.map((c) => (
                    <span key={c} className="h-2.5 w-2.5 rounded-[2px] border border-ink/20" style={{ backgroundColor: getColor(c)?.hex }} />
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-dashed border-ink/15 pt-3 font-mono text-[10px] tracking-[0.14em] text-ink-soft">
                  <span>
                    {kit.project.bricks.length} PCS · {steps} STEPS
                  </span>
                  <EarnedMark slug={kit.slug} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-16 grid gap-10 lg:grid-cols-2" aria-labelledby="custom-heading">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-cobalt">SECTION 02</p>
          <h2 id="custom-heading" className="mt-2 font-display text-2xl font-bold tracking-tight">
            Turn your build into a kit
          </h2>
          <p className="mt-2 max-w-md text-sm text-ink-soft">
            Any creation can become instructions. We sort it bottom to top and group the pieces into steps. Load a
            cartridge here, or press <strong className="text-ink">Play as Guided Kit</strong> in the studio.
          </p>
          <div className="mt-5">
            <CartridgeLauncher />
          </div>
          <Link href="/studio" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-cobalt">
            <Blocks className="h-4 w-4" /> Build something in the studio <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-cobalt">SECTION 03</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">Badge case</h2>
          <p className="mb-5 mt-2 max-w-md text-sm text-ink-soft">Finish a kit to add its badge. Badges are saved in this browser.</p>
          <BadgeShelf />
        </div>
      </section>
    </div>
  );
}
