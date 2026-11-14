'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Focus, Hammer, RotateCcw, Undo2, Volume2, VolumeX } from 'lucide-react';
import { getColor, getPart } from '@/data/brickCatalog';
import type { BuildProject } from '@/types/brick';
import PartThumb from '@/components/studio/PartThumb';
import { inkOn } from '@/components/studio/Swatch';
import { awardBadge, type Badge } from '@/lib/kits/badges';
import { buildSteps, stepParts } from '@/lib/kits/steps';
import { HASH_PREFIX, encodeProject } from '@/lib/studio/share';
import { playSnap } from '@/lib/studio/sound';
import { loadSoundEnabled, saveSoundEnabled } from '@/lib/studio/storage';
import Confetti from './Confetti';
import KitScene, { DROP_MS } from './KitScene';
import MasterBadge from './MasterBadge';

export interface KitPlayerProps {
  project: BuildProject;
  /** Badge key: the kit slug, or "custom". */
  kitId: string;
  /** e.g. "Beginner" or "Custom kit". */
  label: string;
}

const SPIN_MS = 3600;

export default function KitPlayer({ project, kitId, label }: KitPlayerProps) {
  const steps = useMemo(() => buildSteps(project.bricks), [project.bricks]);
  const [done, setDone] = useState(0);
  const [dropping, setDropping] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [badge, setBadge] = useState<Badge | null>(null);
  const [sound, setSound] = useState(loadSoundEnabled);
  const [viewNonce, setViewNonce] = useState(0);
  const timers = useRef<number[]>([]);

  const total = steps.length;
  const complete = total > 0 && done >= total;
  const placed = useMemo(() => steps.slice(0, done).flat(), [steps, done]);
  const current = useMemo(() => (complete ? [] : (steps[done] ?? [])), [complete, steps, done]);
  const parts = useMemo(() => stepParts(current), [current]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const snap = useCallback(() => {
    if (dropping || complete || !current.length) return;
    setDropping(true);
    const pending = timers.current;
    pending.push(window.setTimeout(() => {
      if (sound) playSnap();
      setDropping(false);
      const next = done + 1;
      setDone(next);
      if (next === total) {
        setCelebrating(true);
        setBadge(awardBadge(kitId, project.title));
        pending.push(window.setTimeout(() => setCelebrating(false), SPIN_MS));
      }
    }, DROP_MS));
  }, [dropping, complete, current.length, sound, done, total, kitId, project.title]);

  const back = useCallback(() => {
    if (dropping || done === 0) return;
    setDone((d) => d - 1);
    setBadge(null);
    setCelebrating(false);
  }, [dropping, done]);

  function restart() {
    setDone(0);
    setBadge(null);
    setCelebrating(false);
    setViewNonce((n) => n + 1);
  }

  // Keyboard: Space/Enter/→ snaps, ←/Backspace steps back.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(el.tagName)) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        snap();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        back();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [snap, back]);

  const studioHref = `/studio${HASH_PREFIX}${encodeProject(project)}`;
  const stepNumber = Math.min(done + 1, total);

  return (
    <div className="relative h-[calc(100dvh-4rem)] min-h-[520px] overflow-hidden">
      <div className="absolute inset-0">
        <KitScene
          project={project}
          placed={placed}
          current={current}
          dropping={dropping ? current : null}
          celebrating={celebrating}
          onSnap={snap}
          viewNonce={viewNonce}
        />
      </div>

      {/* Title block + progress */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-between gap-3">
        <div className="pointer-events-auto w-full max-w-sm border border-ink/15 bg-white/95 p-4 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <Link href="/kits" className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.18em] text-ink-soft hover:text-cobalt">
              <ArrowLeft className="h-3 w-3" /> ALL KITS
            </Link>
            <span className="font-mono text-[10px] tracking-[0.18em] text-cobalt">{label.toUpperCase()}</span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">{project.title}</h1>
          <div className="mt-3 flex items-baseline justify-between font-mono text-xs">
            <span aria-live="polite">
              {complete ? (
                <span className="text-emerald-700">COMPLETE · {total} / {total}</span>
              ) : (
                <>
                  STEP <span className="text-base font-semibold text-ink">{stepNumber}</span> / {total}
                </>
              )}
            </span>
            <span className="text-ink-faint">{project.bricks.length} PIECES</span>
          </div>
          <div
            className="mt-2 h-1.5 w-full bg-slate-100"
            role="progressbar"
            aria-label="Build progress"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
          >
            <div className="h-full bg-cobalt transition-[width] duration-300" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="pointer-events-auto flex h-fit gap-1 border border-ink/15 bg-white/95 p-1 backdrop-blur">
          <button
            type="button"
            aria-label="Reset view"
            title="Reset view"
            onClick={() => setViewNonce((n) => n + 1)}
            className="p-2 text-ink-soft hover:bg-slate-100 hover:text-ink"
          >
            <Focus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={sound ? 'Mute sounds' : 'Unmute sounds'}
            title={sound ? 'Mute sounds' : 'Unmute sounds'}
            onClick={() =>
              setSound((on) => {
                saveSoundEnabled(!on);
                return !on;
              })
            }
            className="p-2 text-ink-soft hover:bg-slate-100 hover:text-ink"
          >
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Step card */}
      {!complete && total > 0 && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center sm:justify-end">
          <div className="pointer-events-auto w-full max-w-sm border border-ink/15 bg-white/95 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-2">
              <p className="font-mono text-[10px] tracking-[0.18em] text-ink-soft">STEP {stepNumber} · PARTS NEEDED</p>
              <p className="font-mono text-[10px] tracking-[0.18em] text-cyan">+ HOLOGRAM</p>
            </div>
            <ul className="flex flex-wrap gap-2 px-4 py-3">
              {parts.map((p) => {
                const part = getPart(p.partId)!;
                const color = getColor(p.colorId)!;
                return (
                  <li key={`${p.partId}|${p.colorId}`} className="flex items-center gap-2 border border-ink/10 bg-slate-50/70 py-1.5 pl-2 pr-3">
                    <span style={{ color: inkOn(color.hex) }}>
                      <PartThumb part={part} fill={color.hex} className="h-8 w-12" />
                    </span>
                    <span className="leading-tight">
                      <span className="block font-mono text-sm font-semibold">{p.count}×</span>
                      <span className="block text-[11px] text-ink-soft">
                        {color.name} {part.name}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center gap-2 border-t border-ink/10 p-2">
              <button
                type="button"
                onClick={back}
                disabled={done === 0 || dropping}
                aria-label="Previous step"
                title="Previous step (←)"
                className="flex h-10 items-center gap-1.5 border border-ink/15 px-3 text-sm font-medium text-ink-soft transition-colors hover:border-ink/40 hover:text-ink disabled:opacity-35"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={snap}
                disabled={dropping}
                className="flex h-10 flex-1 items-center justify-center gap-2 bg-ink text-sm font-semibold text-white transition-colors hover:bg-cobalt disabled:opacity-60"
              >
                <Hammer className="h-4 w-4" />
                Snap Step Pieces
                <kbd className="ml-1 border border-white/30 px-1 font-mono text-[10px] font-normal text-white/70">Space</kbd>
              </button>
            </div>
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p className="border border-ink/15 bg-white px-4 py-3 text-sm">This kit has no bricks to build yet.</p>
        </div>
      )}

      {celebrating && <Confetti />}

      {/* Finale */}
      {complete && badge && !celebrating && (
        <div className="absolute inset-0 flex items-end justify-center bg-ink/20 p-3 sm:items-center">
          <div role="dialog" aria-modal="true" aria-labelledby="badge-title" className="w-full max-w-sm border border-ink/20 bg-white p-6 text-center shadow-2xl">
            <MasterBadge className="mx-auto h-28 w-28" />
            <p className="mt-3 font-mono text-[10px] tracking-[0.2em] text-cobalt">
              {badge.completions > 1 ? `BUILT ${badge.completions} TIMES` : 'BADGE EARNED'}
            </p>
            <h2 id="badge-title" className="mt-1 font-display text-2xl font-bold tracking-tight">
              Master Builder Badge
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              You assembled <strong className="font-semibold text-ink">{project.title}</strong> in {total} steps.
            </p>
            <div className="mt-5 grid gap-2">
              <a href={studioHref} className="bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cobalt">
                Open in Studio
              </a>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={restart} className="inline-flex items-center justify-center gap-1.5 border border-ink/20 px-3 py-2 text-sm font-medium hover:border-cobalt hover:text-cobalt">
                  <RotateCcw className="h-4 w-4" /> Build again
                </button>
                <Link href="/kits" className="inline-flex items-center justify-center border border-ink/20 px-3 py-2 text-sm font-medium hover:border-cobalt hover:text-cobalt">
                  More kits
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
