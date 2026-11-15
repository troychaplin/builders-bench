'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BookOpen, Download, ExternalLink, Heart, Scale, Trash2, Upload, X } from 'lucide-react';
import type { BrickSet } from '@/types/set';
import { instructionsUrl, rebrickableUrl } from '@/lib/sets/query';
import { WISHLIST_FILE, exportWishlist, importWishlist } from '@/lib/sets/wishlist';
import { SetImage, ThemeBadge, fmt, scaleTier } from './SetBits';

function Modal({ title, labelId, onClose, children, wide }: { title: ReactNode; labelId: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={labelId} className={`flex max-h-[92dvh] w-full flex-col border border-ink/20 bg-white shadow-2xl ${wide ? 'max-w-4xl' : 'max-w-2xl'}`}>
        <div className="flex items-center justify-between gap-3 border-b border-ink/15 px-5 py-3">
          <h2 id={labelId} className="min-w-0 truncate font-display text-lg font-bold tracking-tight">
            {title}
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="p-1 text-ink-soft hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ---------- detail ---------- */

export function SetDetailModal({
  set,
  wished,
  comparing,
  compareFull,
  onToggleWish,
  onToggleCompare,
  onClose,
}: {
  set: BrickSet;
  wished: boolean;
  comparing: boolean;
  compareFull: boolean;
  onToggleWish: () => void;
  onToggleCompare: () => void;
  onClose: () => void;
}) {
  const tier = scaleTier(set.pieces);
  return (
    <Modal title={set.name} labelId="set-detail-title" onClose={onClose}>
      <div className="grid gap-0 sm:grid-cols-[1.2fr_1fr]">
        <div className="relative aspect-[4/3] border-b border-ink/10 bg-white sm:border-b-0 sm:border-r">
          <SetImage set={set} sizes="(min-width: 640px) 380px, 100vw" priority />
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <ThemeBadge set={set} />
            {set.subtheme && <span className="text-xs text-ink-soft">{set.subtheme}</span>}
          </div>
          <dl className="grid grid-cols-2 gap-px border border-ink/10 bg-ink/10">
            {[
              ['SET NO.', set.setNum],
              ['YEAR', String(set.year)],
              ['PIECES', fmt(set.pieces)],
              ['SCALE', tier.label],
            ].map(([k, v]) => (
              <div key={k} className="bg-white px-3 py-2">
                <dt className="font-mono text-[9px] tracking-[0.18em] text-ink-faint">{k}</dt>
                <dd className="mt-0.5 font-mono text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <a
            href={instructionsUrl(set.setNum)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cobalt"
          >
            <BookOpen className="h-4 w-4" /> Official building instructions <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onToggleWish}
              aria-pressed={wished}
              className={`inline-flex items-center justify-center gap-1.5 border px-3 py-2 text-sm font-medium transition-colors ${
                wished ? 'border-signal-red/40 bg-signal-red/10 text-red-700' : 'border-ink/20 hover:border-signal-red hover:text-red-700'
              }`}
            >
              <Heart className={`h-4 w-4 ${wished ? 'fill-current' : ''}`} /> {wished ? 'Wished' : 'Wish list'}
            </button>
            <button
              type="button"
              onClick={onToggleCompare}
              disabled={!comparing && compareFull}
              aria-pressed={comparing}
              title={!comparing && compareFull ? 'Compare holds up to 3 sets' : undefined}
              className={`inline-flex items-center justify-center gap-1.5 border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
                comparing ? 'border-cobalt/40 bg-cobalt/10 text-cobalt' : 'border-ink/20 hover:border-cobalt hover:text-cobalt'
              }`}
            >
              <Scale className="h-4 w-4" /> {comparing ? 'Comparing' : 'Compare'}
            </button>
          </div>
          <a href={rebrickableUrl(set.setNum)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-ink-soft hover:text-cobalt">
            View on Rebrickable <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- comparison ---------- */

export function CompareModal({ sets, onRemove, onClose }: { sets: BrickSet[]; onRemove: (s: BrickSet) => void; onClose: () => void }) {
  const maxPieces = Math.max(...sets.map((s) => s.pieces), 1);
  const years = sets.map((s) => s.year);
  const rows: { label: string; render: (s: BrickSet) => ReactNode }[] = [
    { label: 'SET NO.', render: (s) => <span className="font-mono">{s.setNum}</span> },
    { label: 'THEME', render: (s) => <ThemeBadge set={s} /> },
    {
      label: 'YEAR',
      render: (s) => (
        <span className="font-mono">
          {s.year}
          {sets.length > 1 && s.year === Math.min(...years) && <span className="ml-1.5 text-[10px] text-ink-faint">OLDEST</span>}
        </span>
      ),
    },
    {
      label: 'PIECES',
      render: (s) => (
        <span className="font-mono font-semibold">
          {fmt(s.pieces)}
          {sets.length > 1 && s.pieces === maxPieces && <span className="ml-1.5 text-[10px] font-normal text-cobalt">MOST</span>}
        </span>
      ),
    },
    {
      label: 'SCALE',
      render: (s) => {
        const tier = scaleTier(s.pieces);
        return (
          <div>
            <div className="h-2 w-full bg-slate-100" aria-hidden="true">
              <div className="h-full" style={{ width: `${Math.max(4, (s.pieces / maxPieces) * 100)}%`, backgroundColor: tier.color }} />
            </div>
            <span className="mt-1 block font-mono text-[10px] tracking-[0.12em]" style={{ color: tier.color }}>
              {tier.label.toUpperCase()} · {Math.round((s.pieces / maxPieces) * 100)}%
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <Modal title="Side-by-side comparison" labelId="compare-title" onClose={onClose} wide>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] table-fixed border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-24" />
              {sets.map((s) => (
                <th key={s.setNum} className="border-l border-ink/10 p-3 text-left align-top font-normal">
                  <div className="relative mb-2 aspect-[4/3] border border-ink/10 bg-white">
                    <SetImage set={s} sizes="240px" />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold leading-tight">{s.name}</span>
                    <button type="button" onClick={() => onRemove(s)} aria-label={`Remove ${s.name} from comparison`} className="shrink-0 p-0.5 text-ink-faint hover:text-signal-red">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-ink/10">
                <th scope="row" className="p-3 text-left align-top font-mono text-[10px] font-normal tracking-[0.16em] text-ink-faint">
                  {r.label}
                </th>
                {sets.map((s) => (
                  <td key={s.setNum} className="border-l border-ink/10 p-3 align-top">
                    {r.render(s)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

/* ---------- wish list ---------- */

export function WishlistPanel({
  list,
  onRemove,
  onOpen,
  onImport,
  onClose,
}: {
  list: BrickSet[];
  onRemove: (s: BrickSet) => void;
  onOpen: (s: BrickSet) => void;
  onImport: (sets: BrickSet[]) => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const total = list.reduce((n, s) => n + s.pieces, 0);

  async function handleFile(file: File) {
    const sets = await importWishlist(file);
    if (!sets) {
      setError('That file isn’t a valid wish list export.');
      return;
    }
    setError(null);
    onImport(sets);
  }

  return (
    <Modal title="Dream Set Wish List" labelId="wishlist-title" onClose={onClose}>
      <div className="grid grid-cols-2 gap-px border-b border-ink/10 bg-ink/10">
        <div className="bg-white px-5 py-3">
          <p className="font-mono text-[9px] tracking-[0.18em] text-ink-faint">SETS</p>
          <p className="font-display text-2xl font-bold tabular-nums">{list.length}</p>
        </div>
        <div className="bg-white px-5 py-3">
          <p className="font-mono text-[9px] tracking-[0.18em] text-ink-faint">TOTAL BRICKS</p>
          <p className="font-display text-2xl font-bold tabular-nums">{fmt(total)}</p>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="p-8 text-center text-sm text-ink-soft">Tap the heart on any set to start your dream list.</p>
      ) : (
        <ul className="divide-y divide-ink/10">
          {list.map((s) => (
            <li key={s.setNum} className="flex items-center gap-3 px-5 py-2.5">
              <button type="button" onClick={() => onOpen(s)} className="relative h-12 w-16 shrink-0 border border-ink/10 bg-white" aria-label={`Open ${s.name}`}>
                <SetImage set={s} sizes="64px" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{s.name}</p>
                <p className="font-mono text-[10px] tracking-[0.1em] text-ink-soft">
                  {s.setNum} · {s.year} · {fmt(s.pieces)} PCS
                </p>
              </div>
              <button type="button" onClick={() => onRemove(s)} aria-label={`Remove ${s.name} from wish list`} className="p-1.5 text-ink-faint hover:text-signal-red">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/15 px-5 py-3">
        <p className="text-xs text-ink-soft">Back up your list so it survives cache clears.</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 border border-ink/20 px-3 py-2 text-sm font-medium hover:border-cobalt hover:text-cobalt">
            <Upload className="h-4 w-4" /> Import Wish List
          </button>
          <button
            type="button"
            onClick={() => exportWishlist(list)}
            disabled={!list.length}
            className="inline-flex items-center gap-1.5 bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-cobalt disabled:opacity-40"
          >
            <Download className="h-4 w-4" /> Export Wish List (.json)
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          aria-label={`Import ${WISHLIST_FILE}`}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
            e.target.value = '';
          }}
        />
        {error && (
          <p role="alert" className="w-full text-xs font-medium text-signal-red">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
