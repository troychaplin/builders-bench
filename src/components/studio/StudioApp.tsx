'use client';

import { useCallback, useEffect, useReducer, useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Box, Check, ChevronsDown, ChevronsUp, Eraser, FileUp, Focus, Hand, Keyboard, PaintBucket, RotateCcwSquare, RotateCw, RotateCwSquare, Square, X } from 'lucide-react';
import { getColor, getPart } from '@/data/brickCatalog';
import { BIN_COUNT } from '@/lib/studio/constants';
import { activeSelection, createInitialState, studioReducer } from '@/lib/studio/reducer';
import { CARTRIDGE_EXT, HASH_PREFIX, downloadCartridge, encodeProject, readCartridge, readHashProject, shareUrl } from '@/lib/studio/share';
import { loadAutosave, loadBins, loadSoundEnabled, saveAutosave, saveBins, saveSoundEnabled } from '@/lib/studio/storage';
import BinsHud from './BinsHud';
import PartsDrawer, { type DrawerTab } from './PartsDrawer';
import type { ViewMode, ViewPan, ViewTilt, ViewTurn } from './StudioCamera';
import StudioScene, { type PlacementInfo, type TouchPending } from './StudioScene';
import Toolbar from './Toolbar';

const SHORTCUTS: [string, string][] = [
  ['Left-click', 'Place / erase / paint'],
  ['Right-drag', 'Orbit (3D) / pan (2D)'],
  ['Middle-drag', 'Pan'],
  ['Arrow keys', 'Pan view'],
  ['Scroll', 'Zoom'],
  ['V', 'Toggle 3D / 2D view'],
  ['Q / E', 'Rotate baseplate left / right'],
  ['W / S', 'Tilt view up / down (3D)'],
  ['1 – 6', 'Pick a BuildBin'],
  ['R', 'Rotate 90° clockwise'],
  ['X', 'Toggle eraser'],
  ['P', 'Toggle paint'],
  ['F', 'My Figures drawer'],
  ['Esc', 'Back to building'],
  ['⌘Z', 'Undo'],
  ['⇧⌘Z', 'Redo'],
];

/** Decide what to open: a shared link wins over the autosave. Runs once, client-only. */
function boot() {
  const bins = loadBins();
  const sound = loadSoundEnabled();
  const shared = readHashProject();
  if (shared) return { project: shared, bins, sound, notice: `Loaded shared build “${shared.title}”.` };
  return { project: loadAutosave(), bins, sound, notice: null };
}

export default function StudioApp() {
  const router = useRouter();
  const [initial] = useState(boot);
  const [state, dispatch] = useReducer(studioReducer, initial, createInitialState);
  const [notice, setNotice] = useState<string | null>(initial.notice);
  const [sound, setSound] = useState(initial.sound);
  const [showKeys, setShowKeys] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab | null>(null);
  const drawerOpen = drawerTab !== null;
  const [dragging, setDragging] = useState(false);
  const [viewNonce, setViewNonce] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [viewTurn, setViewTurn] = useState<ViewTurn>({ id: 0, dir: 1 });
  const [viewTilt, setViewTilt] = useState<ViewTilt>({ id: 0, dir: 1 });
  const [viewPan, setViewPan] = useState<ViewPan>({ id: 0, dx: 0, dy: 0 });
  const panView = useCallback((dx: ViewPan['dx'], dy: ViewPan['dy']) => setViewPan((p) => ({ id: p.id + 1, dx, dy })), []);
  // Touch aim-and-confirm: the scene reports what's pending; these epochs cancel or commit it.
  const [touchPending, setTouchPending] = useState<TouchPending | null>(null);
  const [aimEpoch, setAimEpoch] = useState(0);
  const [commitEpoch, setCommitEpoch] = useState(0);
  const [usingTouch, setUsingTouch] = useState(false);
  const [placement, setPlacement] = useState<PlacementInfo | null>(null);

  const { project, bins, rotation } = state;

  // Autosave (debounced) and bin persistence.
  useEffect(() => {
    const t = window.setTimeout(() => saveAutosave(project), 400);
    return () => window.clearTimeout(t);
  }, [project]);

  useEffect(() => saveBins(bins), [bins]);

  // Auto-dismiss notices.
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(t);
  }, [notice]);

  // Opening a different share link in an already-open tab only changes the hash.
  useEffect(() => {
    function onHashChange() {
      const shared = readHashProject();
      if (!shared) return;
      dispatch({ type: 'load', project: shared });
      setNotice(`Loaded shared build “${shared.title}”.`);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Keyboard shortcuts (paused while the drawer is open).
  useEffect(() => {
    if (drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      const mod = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();

      if (mod && k === 'z') {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? 'redo' : 'undo' });
      } else if (mod && k === 'y') {
        e.preventDefault();
        dispatch({ type: 'redo' });
      } else if (!mod && !e.altKey) {
        const n = Number(k);
        if (Number.isInteger(n) && n >= 1 && n <= BIN_COUNT) dispatch({ type: 'selectBin', index: n - 1 });
        else if (k === 'r') dispatch({ type: 'rotate' });
        else if (k === 'x' || k === 'delete') dispatch({ type: 'toggleTool', tool: 'erase' });
        else if (k === 'p') dispatch({ type: 'toggleTool', tool: 'paint' });
        else if (k === 'f') setDrawerTab('figures');
        else if (k === 'v') setViewMode((m) => (m === '3d' ? '2d' : '3d'));
        else if (k === 'q') setViewTurn((t) => ({ id: t.id + 1, dir: -1 }));
        else if (k === 'e') setViewTurn((t) => ({ id: t.id + 1, dir: 1 }));
        else if (k === 'w') setViewTilt((t) => ({ id: t.id + 1, dir: 1 }));
        else if (k === 's') setViewTilt((t) => ({ id: t.id + 1, dir: -1 }));
        else if (k.startsWith('arrow')) {
          e.preventDefault();
          if (k === 'arrowleft') panView(-1, 0);
          else if (k === 'arrowright') panView(1, 0);
          else if (k === 'arrowup') panView(0, 1);
          else if (k === 'arrowdown') panView(0, -1);
        } else if (k === 'escape') dispatch({ type: 'setTool', tool: 'place' });
        else if (k === '?') setShowKeys((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, panView]);

  const notify = useCallback((message: string) => setNotice(message), []);
  const closeDrawer = useCallback(() => setDrawerTab(null), []);

  async function handleShare() {
    const url = shareUrl(project);
    window.history.replaceState(null, '', url);
    try {
      await navigator.clipboard.writeText(url);
      notify(`Blueprint link copied (${project.bricks.length} bricks).`);
    } catch {
      notify('Blueprint link is in the address bar — copy it from there.');
    }
  }

  async function loadFile(file: File) {
    const loaded = await readCartridge(file);
    if (!loaded) {
      notify(`That file isn’t a valid ${CARTRIDGE_EXT} cartridge.`);
      return;
    }
    dispatch({ type: 'load', project: loaded });
    notify(`Loaded “${loaded.title}” (${loaded.bricks.length} bricks).`);
  }

  function handleDragOver(e: DragEvent) {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragging(true);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void loadFile(file);
  }

  function toggleSound() {
    setSound((on) => {
      saveSoundEnabled(!on);
      return !on;
    });
  }

  const sel = activeSelection(state);
  const part = getPart(sel.partId);
  const color = getColor(sel.colorId);

  return (
    <div
      className="relative h-[calc(100dvh-4rem)] min-h-[520px]"
      onPointerDown={(e) => setUsingTouch(e.pointerType === 'touch')}
      onDragOver={handleDragOver}
      onDragLeave={(e) => e.currentTarget === e.target && setDragging(false)}
      onDrop={handleDrop}
    >
      <div className={`absolute inset-0 ${state.tool === 'place' ? 'cursor-crosshair' : 'cursor-pointer'}`}>
        <StudioScene
          state={state}
          dispatch={dispatch}
          onNotice={notify}
          onPlacementChange={setPlacement}
          viewNonce={viewNonce}
          viewMode={viewMode}
          viewTurn={viewTurn}
          viewTilt={viewTilt}
          viewPan={viewPan}
          aimEpoch={aimEpoch}
          commitEpoch={commitEpoch}
          onTouchPending={setTouchPending}
          sound={sound}
        />
      </div>

      {/* Top toolbar */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-center">
        <div className="pointer-events-auto max-w-full">
          <Toolbar
            state={state}
            dispatch={dispatch}
            sound={sound}
            onToggleSound={toggleSound}
            onShare={handleShare}
            onDownload={() => downloadCartridge(project)}
            onLoadFile={loadFile}
            onPlayAsKit={() => {
              saveAutosave(project);
              router.push(`/kits/play${HASH_PREFIX}${encodeProject(project)}`);
            }}
          />
        </div>
      </div>

      {/* Notice toast */}
      <div aria-live="polite" className="pointer-events-none absolute inset-x-0 top-28 flex justify-center px-3 sm:top-20">
        {notice && <p className="border border-ink/15 bg-ink px-3 py-2 text-xs font-medium text-white shadow-lg">{notice}</p>}
      </div>

      {/* Bottom HUD: status, bins, shortcuts */}
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col items-center gap-2">
        <div className="flex w-full max-w-3xl flex-wrap items-end justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border border-ink/15 bg-white/90 px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-ink-soft backdrop-blur">
            <span>
              BRICKS <span className="text-ink">{project.bricks.length}</span>
              {project.figures?.length ? (
                <>
                  {' '}· FIGURES <span className="text-ink">{project.figures.length}</span>
                </>
              ) : null}
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <span className="h-2.5 w-2.5 rounded-sm border border-ink/20" style={{ backgroundColor: color?.hex }} aria-hidden="true" />
              <span className="text-ink">
                {(state.tool === 'figure' && state.placingFigure ? state.placingFigure.name : part?.name)?.toUpperCase()}
              </span>{' '}
              · {rotation}°
            </span>
            {placement && (
              <span className={placement.valid ? '' : 'text-signal-red'}>
                X {placement.x} · Y {placement.y} · Z {placement.z}
              </span>
            )}
          </div>

          <div className="pointer-events-auto relative ml-auto flex items-end gap-2">
            <ViewControls
              mode={viewMode}
              onMode={setViewMode}
              onTurn={(dir) => setViewTurn((t) => ({ id: t.id + 1, dir }))}
              onTilt={(dir) => setViewTilt((t) => ({ id: t.id + 1, dir }))}
              onPan={panView}
              onReset={() => setViewNonce((n) => n + 1)}
            />
            {showKeys && (
              <div className="absolute bottom-11 right-0 w-64 border border-ink/15 bg-white/95 p-3 shadow-lg backdrop-blur" role="dialog" aria-label="Keyboard shortcuts">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-mono text-[10px] tracking-[0.2em] text-ink-soft">CONTROLS</p>
                  <button type="button" aria-label="Close shortcuts" onClick={() => setShowKeys(false)} className="text-ink-faint hover:text-ink">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <dl className="space-y-1 text-xs">
                  {SHORTCUTS.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt>
                        <kbd className="border border-ink/15 bg-slate-50 px-1 font-mono text-[10px]">{k}</kbd>
                      </dt>
                      <dd className="text-right text-ink-soft">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowKeys((v) => !v)}
              aria-expanded={showKeys}
              aria-label="Controls and shortcuts"
              title="Controls and shortcuts (?)"
              className="flex h-9 w-9 items-center justify-center border border-ink/15 bg-white/95 text-ink-soft backdrop-blur hover:text-ink focus-visible:outline-2 focus-visible:outline-cobalt"
            >
              <Keyboard className="h-4 w-4" />
            </button>
          </div>
        </div>

        {usingTouch && (
          <TouchConfirmBar
            pending={touchPending}
            tool={state.tool}
            onConfirm={() => setCommitEpoch((n) => n + 1)}
            onRotate={() => dispatch({ type: 'rotate' })}
            onCancel={() => setAimEpoch((n) => n + 1)}
          />
        )}

        <div className="pointer-events-auto flex w-full justify-center">
          <BinsHud state={state} dispatch={dispatch} onOpenDrawer={() => setDrawerTab('bins')} onOpenFigures={() => setDrawerTab('figures')} />
        </div>
      </div>

      {/* Drop zone overlay */}
      {dragging && (
        <div className="pointer-events-none absolute inset-3 flex items-center justify-center border-2 border-dashed border-cobalt bg-cobalt/10 backdrop-blur-[1px]">
          <p className="flex items-center gap-2 bg-white px-4 py-2 text-sm font-semibold text-cobalt shadow">
            <FileUp className="h-4 w-4" /> Drop a {CARTRIDGE_EXT} cartridge to load it
          </p>
        </div>
      )}

      {drawerTab && <PartsDrawer state={state} dispatch={dispatch} onClose={closeDrawer} initialTab={drawerTab} />}
    </div>
  );
}

const viewBtn =
  'flex h-9 w-9 items-center justify-center text-ink-soft transition-colors hover:bg-slate-100 hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt';

/** On-canvas camera controls: 3D/2D toggle, rotate the baseplate view, reset. */
function ViewControls({
  mode,
  onMode,
  onTurn,
  onTilt,
  onPan,
  onReset,
}: {
  mode: ViewMode;
  onMode: (m: ViewMode) => void;
  onTurn: (dir: 1 | -1) => void;
  onTilt: (dir: 1 | -1) => void;
  onPan: (dx: ViewPan['dx'], dy: ViewPan['dy']) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex border border-ink/15 bg-white/95 backdrop-blur" role="toolbar" aria-label="View">
      <div className="flex" role="radiogroup" aria-label="Camera view">
        {(
          [
            { id: '3d', label: '3D view', icon: Box },
            { id: '2d', label: 'Top-down 2D view', icon: Square },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={mode === id}
            aria-label={label}
            title={`${label} (V)`}
            onClick={() => onMode(id)}
            className={`flex h-9 items-center gap-1 px-2 font-mono text-[10px] font-semibold tracking-[0.1em] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt ${
              mode === id ? 'bg-ink text-white' : 'text-ink-soft hover:bg-slate-100 hover:text-ink'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{id.toUpperCase()}</span>
          </button>
        ))}
      </div>
      <span className="my-2 w-px bg-ink/15" aria-hidden="true" />
      <button type="button" aria-label="Rotate baseplate left" title="Rotate baseplate left (Q)" onClick={() => onTurn(-1)} className={viewBtn}>
        <RotateCcwSquare className="h-4 w-4" />
      </button>
      <button type="button" aria-label="Rotate baseplate right" title="Rotate baseplate right (E)" onClick={() => onTurn(1)} className={viewBtn}>
        <RotateCwSquare className="h-4 w-4" />
      </button>
      {mode === '3d' && (
        <>
          <button type="button" aria-label="Tilt view up" title="Tilt view up (W)" onClick={() => onTilt(1)} className={viewBtn}>
            <ChevronsUp className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Tilt view down" title="Tilt view down (S)" onClick={() => onTilt(-1)} className={viewBtn}>
            <ChevronsDown className="h-4 w-4" />
          </button>
        </>
      )}
      {/* Fingers pan with two-finger drags; the buttons are for mouse and trackpad. */}
      <span className="my-2 hidden w-px bg-ink/15 md:block" aria-hidden="true" />
      <div className="hidden md:flex" role="group" aria-label="Pan view">
        {(
          [
            { label: 'Pan left', icon: ArrowLeft, dx: -1, dy: 0 },
            { label: 'Pan up', icon: ArrowUp, dx: 0, dy: 1 },
            { label: 'Pan down', icon: ArrowDown, dx: 0, dy: -1 },
            { label: 'Pan right', icon: ArrowRight, dx: 1, dy: 0 },
          ] as const
        ).map(({ label, icon: Icon, dx, dy }) => (
          <button key={label} type="button" aria-label={label} title={`${label} (arrow keys)`} onClick={() => onPan(dx, dy)} className={viewBtn}>
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <span className="my-2 hidden w-px bg-ink/15 md:block" aria-hidden="true" />
      <button type="button" aria-label="Reset view" title="Reset view" onClick={onReset} className={viewBtn}>
        <Focus className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Touch-only confirm bar. Fingers aim (or select) first; nothing changes until
 * the primary button is pressed, so imprecise taps never place or erase by accident.
 */
function TouchConfirmBar({
  pending,
  tool,
  onConfirm,
  onRotate,
  onCancel,
}: {
  pending: TouchPending | null;
  tool: string;
  onConfirm: () => void;
  onRotate: () => void;
  onCancel: () => void;
}) {
  if (!pending) {
    const hint =
      tool === 'erase'
        ? 'Tap a brick to select it for erasing'
        : tool === 'paint'
          ? 'Tap a brick to select it for painting'
          : 'Drag or tap on the plate to aim, then press Place';
    return (
      <p className="pointer-events-none flex items-center gap-2 border border-ink/15 bg-white/95 px-3 py-2 text-xs text-ink-soft shadow-sm backdrop-blur">
        <Hand className="h-4 w-4 shrink-0 text-cobalt" /> {hint}
      </p>
    );
  }

  const primary = {
    place: { label: 'Place', icon: Check, cls: 'bg-cobalt hover:bg-blue-700' },
    erase: { label: 'Erase', icon: Eraser, cls: 'bg-signal-red hover:bg-red-600' },
    paint: { label: 'Paint', icon: PaintBucket, cls: 'bg-cobalt hover:bg-blue-700' },
  }[pending.kind];
  const Icon = primary.icon;

  return (
    <div className="pointer-events-auto flex w-full max-w-md flex-col items-center gap-1.5" role="group" aria-label="Confirm action">
      {!pending.valid && pending.reason && (
        <p className="border border-signal-red/30 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-red-700 shadow-sm">{pending.reason}</p>
      )}
      <div className="flex w-full items-stretch gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={!pending.valid}
          className={`flex h-12 flex-1 items-center justify-center gap-2 text-base font-semibold text-white shadow-lg transition-colors disabled:cursor-not-allowed disabled:bg-ink/40 ${primary.cls}`}
        >
          <Icon className="h-5 w-5" /> {primary.label}
        </button>
        {pending.kind === 'place' && (
          <button
            type="button"
            onClick={onRotate}
            aria-label="Rotate part"
            className="flex h-12 w-12 items-center justify-center border border-ink/15 bg-white/95 text-ink shadow-lg backdrop-blur hover:bg-slate-100"
          >
            <RotateCw className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          className="flex h-12 w-12 items-center justify-center border border-ink/15 bg-white/95 text-ink shadow-lg backdrop-blur hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
