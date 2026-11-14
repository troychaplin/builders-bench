import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import ModuleIcon from '@/components/ModuleIcon';
import { pad2, type AppMode } from '@/data/modes';

export default function ModeCard({ mode }: { mode: AppMode }) {
  const active = mode.status === 'active';

  return (
    <Link
      href={mode.href}
      className="group relative flex flex-col border border-transparent bg-white p-6 transition-all hover:border-cobalt hover:shadow-[0_18px_40px_-28px_rgba(37,99,235,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt sm:p-7"
    >
      {/* stud-grid corner accent */}
      <span
        className="stud-dots absolute right-0 top-0 h-14 w-14 text-ink/10 transition-colors group-hover:text-cobalt/25"
        aria-hidden="true"
      />

      <div className="flex items-center justify-between gap-3 font-mono text-[10px] tracking-[0.18em]">
        <span className="text-ink-soft">MOD // {pad2(mode.index)}</span>
      </div>

      <ModuleIcon
        mode={mode.key}
        className={`mt-6 h-12 w-12 transition-colors ${active ? 'text-cobalt' : 'text-ink group-hover:text-cobalt'}`}
      />

      <h3 className="mt-5 font-display text-2xl font-bold tracking-tight">{mode.title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">{mode.description}</p>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-dashed border-ink/15 pt-4">
        {active ? (
          <span className="inline-flex items-center gap-2 border border-emerald/40 bg-emerald/10 px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald" aria-hidden="true" />
            ACTIVE WORKSPACE
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 border border-ink/15 bg-slate-50 px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.16em] text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-faint" aria-hidden="true" />
            PHASE {pad2(mode.phase)}
          </span>
        )}
        <ArrowUpRight
          className="h-5 w-5 text-ink-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-cobalt"
          strokeWidth={1.75}
        />
      </div>
    </Link>
  );
}
