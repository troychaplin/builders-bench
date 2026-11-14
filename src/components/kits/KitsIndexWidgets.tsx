'use client';

import { useRef, useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp } from 'lucide-react';
import { STARTER_KITS } from '@/data/starterKits';
import { CUSTOM_KIT_ID, loadBadges } from '@/lib/kits/badges';
import { CARTRIDGE_EXT, HASH_PREFIX, encodeProject, readCartridge } from '@/lib/studio/share';
import MasterBadge from './MasterBadge';

/* Client-only widgets for the /kits index (they read localStorage or files). */

export function EarnedMark({ slug }: { slug: string }) {
  const [badge] = useState(() => loadBadges()[slug]);
  if (!badge) return null;
  return (
    <span className="inline-flex items-center gap-1.5 border border-builder-yellow/50 bg-builder-yellow/10 px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.14em] text-amber-700">
      <MasterBadge className="h-4 w-4" /> BADGE EARNED
    </span>
  );
}

export function BadgeShelf() {
  const [book] = useState(loadBadges);
  const slots = [
    ...STARTER_KITS.map((k) => ({ id: k.slug, title: k.project.title })),
    { id: CUSTOM_KIT_ID, title: 'Custom Kit' },
  ];
  const earned = slots.filter((s) => book[s.id]).length;

  return (
    <div>
      <p className="mb-3 font-mono text-[10px] tracking-[0.18em] text-ink-soft">
        {earned} / {slots.length} MASTER BUILDER BADGES
      </p>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {slots.map((s) => {
          const badge = book[s.id];
          return (
            <li key={s.id} className="flex flex-col items-center gap-1.5 border border-ink/10 bg-white/80 px-2 py-3 text-center">
              <MasterBadge className="h-12 w-12" muted={!badge} />
              <span className={`text-[11px] font-medium leading-tight ${badge ? 'text-ink' : 'text-ink-faint'}`}>{s.title}</span>
              {badge && badge.completions > 1 && (
                <span className="font-mono text-[9px] tracking-[0.12em] text-ink-faint">×{badge.completions}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Upload a `.brick.json` cartridge and launch it as a guided kit. */
export function CartridgeLauncher() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function launch(file: File) {
    setError(null);
    const project = await readCartridge(file);
    if (!project) {
      setError(`That file isn’t a valid ${CARTRIDGE_EXT} cartridge.`);
      return;
    }
    if (!project.bricks.length) {
      setError('That cartridge has no bricks in it yet.');
      return;
    }
    router.push(`/kits/play${HASH_PREFIX}${encodeProject(project)}`);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void launch(file);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragging ? 'border-cobalt bg-cobalt/5' : 'border-ink/20 bg-white/70 hover:border-cobalt'
        }`}
      >
        <FileUp className="h-6 w-6 text-cobalt" />
        <span className="text-sm font-semibold">Drop a {CARTRIDGE_EXT} cartridge</span>
        <span className="text-xs text-ink-soft">or click to choose a file</span>
      </button>
      <input
        ref={input}
        type="file"
        accept={`${CARTRIDGE_EXT},.json,application/json`}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void launch(file);
          e.target.value = '';
        }}
      />
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-signal-red">
          {error}
        </p>
      )}
    </div>
  );
}
