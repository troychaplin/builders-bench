'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Blocks, Dices, Download, IdCard as IdCardIcon, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { BRICK_COLORS } from '@/data/brickCatalog';
import { COLOR_LABEL, FACTIONS, SLOTS, getFaction, partName, type FigureSlot } from '@/data/figureParts';
import type { BlockFigure } from '@/types/brick';
import { swatchStyle } from '@/components/studio/Swatch';
import {
  FIGURE_EXT,
  defaultFigure,
  deleteFigure,
  downloadBlob,
  exportFigure,
  figureFileSlug,
  importFigure,
  loadFigures,
  newFigureId,
  randomFigure,
  saveFigure,
  sanitizeFigure,
} from '@/lib/figures/figure';
import { playChime, playTick } from '@/lib/studio/sound';
import { loadSoundEnabled } from '@/lib/studio/storage';
import FigureIcon from './FigureIcon';
import IdCard, { cardToPng } from './IdCard';

const FigurePreview = dynamic(() => import('./FigurePreview'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center font-mono text-[11px] tracking-[0.2em] text-ink-soft">+ ASSEMBLING…</div>,
});

const REEL_STOPS = [650, 850, 1050, 1250, 1450];
const REEL_TICK_MS = 80;

/** Copy one slot (part + its colors) from `src` onto `dst`. */
function copySlot(dst: BlockFigure, src: BlockFigure, slotIndex: number): BlockFigure {
  const slot = SLOTS[slotIndex];
  const colors = { ...dst.colors };
  for (const k of slot.colorKeys) colors[k] = src.colors[k];
  return { ...dst, [slot.field]: src[slot.field], colors };
}

export default function FigureLab() {
  const [figure, setFigure] = useState<BlockFigure>(() => loadFigures()[0] ?? defaultFigure());
  const [saved, setSaved] = useState<BlockFigure[]>(loadFigures);
  const [slot, setSlot] = useState<FigureSlot>('headgear');
  const [preview, setPreview] = useState<BlockFigure | null>(null);
  const [settled, setSettled] = useState(SLOTS.length);
  const [cardOpen, setCardOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const spinTimer = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const spinning = preview !== null;
  const shown = preview ?? figure;
  const slotDef = SLOTS.find((s) => s.slot === slot)!;
  const savedVersion = saved.find((f) => f.id === figure.id);
  const dirty = useMemo(() => !savedVersion || JSON.stringify(savedVersion) !== JSON.stringify(figure), [savedVersion, figure]);

  useEffect(() => () => void (spinTimer.current && window.clearInterval(spinTimer.current)), []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2800);
    return () => window.clearTimeout(t);
  }, [notice]);

  const update = (patch: Partial<BlockFigure>) => setFigure((f) => ({ ...f, ...patch }));
  const setColor = (key: string, colorId: string) => setFigure((f) => ({ ...f, colors: { ...f.colors, [key]: colorId } }));

  function randomize() {
    if (spinning) return;
    const sound = loadSoundEnabled();
    const target = randomFigure(figure);
    const started = performance.now();
    let lastSettled = 0;
    setSettled(0);
    setPreview(randomFigure(figure));

    spinTimer.current = window.setInterval(() => {
      const t = performance.now() - started;
      const count = REEL_STOPS.filter((s) => t >= s).length;
      let frame = randomFigure(figure);
      for (let i = 0; i < count; i++) frame = copySlot(frame, target, i);
      frame = { ...frame, faction: count === SLOTS.length ? target.faction : frame.faction };
      setPreview(frame);
      setSettled(count);
      if (sound) playTick();
      if (count > lastSettled && count === SLOTS.length) {
        window.clearInterval(spinTimer.current!);
        spinTimer.current = null;
        setFigure(target);
        setPreview(null);
        if (sound) playChime();
      }
      lastSettled = count;
    }, REEL_TICK_MS);
  }

  function save() {
    setSaved(saveFigure(figure));
    setNotice(`Saved “${figure.name}” to My Figures.`);
  }

  function startNew() {
    setFigure({ ...defaultFigure(), id: newFigureId() });
  }

  function duplicate() {
    setFigure((f) => ({ ...f, id: newFigureId(), name: `${f.name} II`.slice(0, 32) }));
  }

  function remove(f: BlockFigure) {
    if (!window.confirm(`Delete “${f.name}” from My Figures?`)) return;
    setSaved(deleteFigure(f.id));
    if (f.id === figure.id) setNotice('Removed from My Figures. Still editing — save again to keep it.');
  }

  async function onImport(file: File) {
    const imported = await importFigure(file);
    if (!imported) {
      setNotice(`That file isn’t a valid ${FIGURE_EXT}.`);
      return;
    }
    setFigure(imported);
    setNotice(`Imported “${imported.name}”. Save it to add it to My Figures.`);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-ink/15 pb-6">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-cobalt">MOD // 03 — FIGURE LAB</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Mix-and-Match Lab</h1>
          <p className="mt-2 max-w-xl text-ink-soft">Snap together a hero, give them a name and a faction, then drop them into your builds.</p>
        </div>
        <button
          type="button"
          onClick={randomize}
          disabled={spinning}
          className="group inline-flex items-center gap-2.5 bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cobalt disabled:opacity-70"
        >
          <Dices className={`h-5 w-5 ${spinning ? 'animate-spin' : 'transition-transform group-hover:rotate-12'}`} />
          {spinning ? 'Spinning…' : 'Randomize Hero'}
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        {/* Preview + reels */}
        <section className="flex min-w-0 flex-col border border-ink/15 bg-white/90">
          <div className="flex items-center justify-between border-b border-ink/15 px-4 py-2.5 font-mono text-[10px] tracking-[0.16em] text-ink-soft">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getFaction(shown.faction).hex }} aria-hidden="true" />
              {shown.name.toUpperCase()} · {getFaction(shown.faction).name.toUpperCase()}
            </span>
            <span>{dirty ? 'UNSAVED' : 'SAVED'}</span>
          </div>
          <div className="relative h-[380px] sm:h-[440px]">
            <FigurePreview figure={shown} spinning={spinning} />
          </div>
          <div className="grid grid-cols-5 border-t border-ink/15" aria-live="polite" aria-label="Part reels">
            {SLOTS.map((s, i) => {
              const rolling = spinning && i >= settled;
              return (
                <div key={s.slot} className={`min-w-0 overflow-hidden px-1.5 py-2.5 text-center ${i > 0 ? 'border-l border-ink/10' : ''} ${rolling ? 'bg-slate-50' : ''}`}>
                  <p className="font-mono text-[9px] tracking-[0.16em] text-ink-faint">{s.label.toUpperCase()}</p>
                  <p key={rolling ? 'roll' : shown[s.field]} className={`mt-1 truncate text-[11px] font-semibold leading-tight ${rolling ? 'reel-spin text-ink-soft' : 'reel-land'}`}>
                    {partName(s.parts, shown[s.field])}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Controls */}
        <section className="flex min-w-0 flex-col border border-ink/15 bg-white/90">
          <div className="grid gap-4 border-b border-ink/15 p-4 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="font-mono text-[10px] tracking-[0.18em] text-ink-soft">HERO NAME</span>
              <input
                value={figure.name}
                maxLength={32}
                onChange={(e) => update({ name: e.target.value })}
                onBlur={() => update({ name: figure.name.trim() || 'Unnamed Hero' })}
                className="mt-1 w-full border border-ink/15 bg-white px-3 py-2 font-display text-lg font-bold tracking-tight outline-none focus:border-cobalt"
              />
            </label>
            <fieldset>
              <legend className="font-mono text-[10px] tracking-[0.18em] text-ink-soft">FACTION</legend>
              <div className="mt-1 flex">
                {FACTIONS.map((f) => {
                  const active = figure.faction === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => update({ faction: f.id })}
                      className={`-ml-px border px-3 py-2.5 text-xs font-semibold first:ml-0 ${active ? 'relative z-10 text-white' : 'border-ink/15 text-ink-soft hover:text-ink'}`}
                      style={active ? { backgroundColor: f.hex, borderColor: f.hex } : undefined}
                    >
                      {f.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div role="tablist" aria-label="Figure slots" className="flex overflow-x-auto border-b border-ink/15">
            {SLOTS.map((s) => {
              const active = s.slot === slot;
              return (
                <button
                  key={s.slot}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setSlot(s.slot)}
                  className={`relative shrink-0 px-4 py-3 text-sm font-medium ${active ? 'text-ink' : 'text-ink-soft hover:text-ink'}`}
                >
                  {s.label}
                  {active && <span className="absolute inset-x-3 -bottom-px h-0.5 bg-cobalt" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" className="flex-1 space-y-5 p-4">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {slotDef.parts.map((p) => {
                const selected = figure[slotDef.field] === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={selected}
                    disabled={spinning}
                    onClick={() => update({ [slotDef.field]: p.id } as Partial<BlockFigure>)}
                    className={`flex flex-col items-center gap-1 border px-2 py-2 text-center transition-colors ${
                      selected ? 'border-cobalt bg-cobalt/5 text-cobalt' : 'border-ink/15 hover:border-ink/40'
                    }`}
                  >
                    <FigureIcon figure={{ ...figure, [slotDef.field]: p.id }} size={40} />
                    <span className="text-[11px] font-medium leading-tight">{p.name}</span>
                  </button>
                );
              })}
            </div>

            {slotDef.colorKeys.map((key) => (
              <div key={key}>
                <p className="mb-1.5 font-mono text-[10px] tracking-[0.18em] text-ink-soft">{COLOR_LABEL[key].toUpperCase()} COLOR</p>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`${COLOR_LABEL[key]} color`}>
                  {BRICK_COLORS.map((c) => {
                    const selected = figure.colors[key] === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={c.name}
                        title={c.name}
                        disabled={spinning}
                        onClick={() => setColor(key, c.id)}
                        className={`h-6 w-6 rounded-sm border transition-transform hover:scale-110 ${selected ? 'border-ink ring-2 ring-cobalt ring-offset-1' : 'border-ink/20'}`}
                        style={swatchStyle(c)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-ink/15 p-3">
            <button type="button" onClick={save} disabled={spinning} className="inline-flex items-center gap-1.5 bg-cobalt px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              <Save className="h-4 w-4" /> {savedVersion ? 'Save changes' : 'Save to My Figures'}
            </button>
            <button type="button" onClick={() => setCardOpen(true)} disabled={spinning} className="inline-flex items-center gap-1.5 border border-ink/20 px-3 py-2 text-sm font-medium hover:border-cobalt hover:text-cobalt">
              <IdCardIcon className="h-4 w-4" /> ID Card
            </button>
            <span className="mx-1 hidden h-5 w-px bg-ink/15 sm:block" aria-hidden="true" />
            <button type="button" onClick={startNew} aria-label="New figure" title="New figure" className="p-2 text-ink-soft hover:text-ink">
              <Plus className="h-4 w-4" />
            </button>
            <button type="button" onClick={duplicate} className="px-2 py-2 text-xs font-medium text-ink-soft hover:text-ink">
              Duplicate
            </button>
            <button type="button" onClick={() => exportFigure(figure)} aria-label={`Export ${FIGURE_EXT}`} title={`Export ${FIGURE_EXT}`} className="p-2 text-ink-soft hover:text-ink">
              <Download className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} aria-label={`Import ${FIGURE_EXT}`} title={`Import ${FIGURE_EXT}`} className="p-2 text-ink-soft hover:text-ink">
              <Upload className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={`${FIGURE_EXT},.json,application/json`}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImport(f);
                e.target.value = '';
              }}
            />
          </div>
        </section>
      </div>

      {/* My Figures */}
      <section className="mt-12" aria-labelledby="my-figures">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-ink/15 pb-3">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-cobalt">SECTION 02</p>
            <h2 id="my-figures" className="mt-1 font-display text-2xl font-bold tracking-tight">
              My Figures <span className="font-mono text-sm font-normal text-ink-faint">({saved.length})</span>
            </h2>
          </div>
          <Link href="/studio" className="inline-flex items-center gap-2 text-sm font-semibold hover:text-cobalt">
            <Blocks className="h-4 w-4" /> Place them in the Studio via “My Figures”
          </Link>
        </div>
        {saved.length === 0 ? (
          <p className="border border-dashed border-ink/20 bg-white/70 p-6 text-center text-sm text-ink-soft">
            No saved heroes yet. Build one above and press <strong className="text-ink">Save to My Figures</strong>.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {saved.map((f) => {
              const editing = f.id === figure.id;
              return (
                <li key={f.id} className={`group relative border bg-white/90 ${editing ? 'border-cobalt' : 'border-ink/15'}`}>
                  <button type="button" onClick={() => !spinning && setFigure(f)} className="flex w-full flex-col items-center gap-1 px-2 pb-3 pt-3 text-center">
                    <FigureIcon figure={f} size={64} />
                    <span className="w-full truncate text-sm font-semibold">{f.name}</span>
                    <span className="font-mono text-[9px] tracking-[0.16em]" style={{ color: getFaction(f.faction).hex }}>
                      {getFaction(f.faction).name.toUpperCase()}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(f)}
                    aria-label={`Delete ${f.name}`}
                    className="absolute right-1 top-1 p-1 text-ink-faint opacity-0 transition-opacity hover:text-signal-red focus:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {notice && (
        <div aria-live="polite" className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-3">
          <p className="border border-ink/15 bg-ink px-3 py-2 text-xs font-medium text-white shadow-lg">{notice}</p>
        </div>
      )}

      {cardOpen && <CardModal figure={figure} onClose={() => setCardOpen(false)} />}
    </div>
  );
}

function CardModal({ figure, onClose }: { figure: BlockFigure; onClose: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [issued] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function download() {
    if (!svgRef.current) return;
    setBusy(true);
    const png = await cardToPng(svgRef.current);
    setBusy(false);
    if (png) downloadBlob(png, `${figureFileSlug(figure.name)}-id-card.png`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="card-title" className="w-full max-w-xl border border-ink/20 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink/15 px-5 py-3">
          <h2 id="card-title" className="font-display text-lg font-bold tracking-tight">
            Builder ID Card
          </h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close ID card" className="p-1 text-ink-soft hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          <IdCard ref={svgRef} figure={sanitizeFigure(figure) ?? figure} issued={issued} />
        </div>
        <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-3">
          <button type="button" onClick={onClose} className="border border-ink/20 px-4 py-2 text-sm font-medium hover:border-ink/40">
            Close
          </button>
          <button type="button" onClick={download} disabled={busy} className="inline-flex items-center gap-1.5 bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-cobalt disabled:opacity-60">
            <Download className="h-4 w-4" /> {busy ? 'Rendering…' : 'Download PNG'}
          </button>
        </div>
      </div>
    </div>
  );
}
