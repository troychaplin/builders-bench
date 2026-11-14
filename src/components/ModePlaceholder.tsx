import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ModuleIcon from '@/components/ModuleIcon';
import { pad2, type AppMode } from '@/data/modes';

/** Temporary page shell for a module that hasn't been built yet. */
export default function ModePlaceholder({ mode }: { mode: AppMode }) {
  const active = mode.status === 'active';
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-20">
      <section className="reg-marks w-full max-w-xl border border-ink/15 bg-white/90 backdrop-blur-[2px]">
        <span className="reg reg-tl" /><span className="reg reg-tr" />
        <span className="reg reg-bl" /><span className="reg reg-br" />

        <div className="flex items-center justify-between border-b border-ink/15 px-5 py-2.5 font-mono text-[10px] tracking-[0.18em] text-ink-soft">
          <span>MOD // {pad2(mode.index)}</span>
          <span className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald' : 'bg-builder-yellow'}`} aria-hidden="true" />
            PHASE {pad2(mode.phase)} · IN DRAFTING
          </span>
        </div>

        <div className="p-8 sm:p-10">
          <ModuleIcon mode={mode.key} className="h-14 w-14 text-cobalt" />
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight">{mode.title}</h1>
          <p className="mt-3 max-w-md text-ink-soft">{mode.description}</p>
          <p className="mt-6 font-mono text-[11px] tracking-[0.14em] text-ink-faint">
            + THIS MODULE IS STILL ON THE DRAWING BOARD.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 border border-ink/20 px-4 py-2 text-sm font-medium transition-colors hover:border-cobalt hover:text-cobalt"
          >
            <ArrowLeft className="h-4 w-4" /> Back to the Hub
          </Link>
        </div>
      </section>
    </div>
  );
}
