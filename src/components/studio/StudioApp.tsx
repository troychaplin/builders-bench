'use client';

import { useCallback, useEffect, useReducer, useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, Keyboard, X } from 'lucide-react';
import { getColor, getPart } from '@/data/brickCatalog';
import { BIN_COUNT } from '@/lib/studio/constants';
import { activeSelection, createInitialState, studioReducer } from '@/lib/studio/reducer';
import { CARTRIDGE_EXT, HASH_PREFIX, downloadCartridge, encodeProject, readCartridge, readHashProject, shareUrl } from '@/lib/studio/share';
import { loadAutosave, loadBins, loadSoundEnabled, saveAutosave, saveBins, saveSoundEnabled } from '@/lib/studio/storage';
import BinsHud from './BinsHud';
import PartsDrawer from './PartsDrawer';
import StudioScene, { type PlacementInfo } from './StudioScene';
import Toolbar from './Toolbar';

const SHORTCUTS: [string, string][] = [
  ['Left-click', 'Place / erase / paint'],
  ['Right-drag', 'Orbit camera'],
  ['Middle-drag', 'Pan'],
  ['Scroll', 'Zoom'],
  ['1 – 6', 'Pick a BuildBin'],
  ['R', 'Rotate 90° clockwise'],
  ['X', 'Toggle eraser'],
  ['P', 'Toggle paint'],
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [viewNonce, setViewNonce] = useState(0);
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
        else if (k === 'escape') dispatch({ type: 'setTool', tool: 'place' });
        else if (k === '?') setShowKeys((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const notify = useCallback((message: string) => setNotice(message), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

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
            onResetView={() => setViewNonce((n) => n + 1)}
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
        <div className="flex w-full max-w-3xl items-end justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border border-ink/15 bg-white/90 px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] text-ink-soft backdrop-blur">
            <span>
              BRICKS <span className="text-ink">{project.bricks.length}</span>
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <span className="h-2.5 w-2.5 rounded-sm border border-ink/20" style={{ backgroundColor: color?.hex }} aria-hidden="true" />
              <span className="text-ink">{part?.name.toUpperCase()}</span> · {rotation}°
            </span>
            {placement && (
              <span className={placement.valid ? '' : 'text-signal-red'}>
                X {placement.x} · Y {placement.y} · Z {placement.z}
              </span>
            )}
          </div>

          <div className="pointer-events-auto relative">
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

        <div className="pointer-events-auto flex w-full justify-center">
          <BinsHud state={state} dispatch={dispatch} onOpenDrawer={() => setDrawerOpen(true)} />
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

      {drawerOpen && <PartsDrawer state={state} dispatch={dispatch} onClose={closeDrawer} />}
    </div>
  );
}
