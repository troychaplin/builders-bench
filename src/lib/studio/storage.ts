import type { BuildProject } from '@/types/brick';
import { getColor, getPart } from '@/data/brickCatalog';
import { RECENT_COUNT } from './constants';
import { DEFAULT_PALETTE, type Palette } from './reducer';
import { sanitizeProject } from './share';

const AUTOSAVE_KEY = 'builders-bench:studio:autosave';
const PALETTE_KEY = 'builders-bench:studio:palette';
/** Pre-palette storage: six { partId, colorId } BuildBins. Read once to seed recents. */
const LEGACY_BINS_KEY = 'builders-bench:studio:bins';
const SOUND_KEY = 'builders-bench:studio:sound';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode, quota) — persistence is best-effort.
  }
}

function readJson(key: string): unknown {
  const raw = read(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Autosave stores the full project JSON and runs it back through validation. */
export function loadAutosave(): BuildProject | null {
  return sanitizeProject(readJson(AUTOSAVE_KEY));
}

export function saveAutosave(project: BuildProject): void {
  write(AUTOSAVE_KEY, JSON.stringify(project));
}

function validIds(raw: unknown, valid: (id: string) => boolean, fallback: string[]): string[] {
  if (!Array.isArray(raw)) return fallback;
  const ids = [...new Set(raw.filter((id): id is string => typeof id === 'string' && valid(id)))].slice(0, RECENT_COUNT);
  return ids.length ? ids : fallback;
}

const isPart = (id: string) => !!getPart(id);
const isColor = (id: string) => !!getColor(id);

export function loadPalette(): Palette {
  let raw = readJson(PALETTE_KEY) as Partial<Palette> | null;
  if (!raw) {
    const bins = readJson(LEGACY_BINS_KEY);
    if (Array.isArray(bins)) {
      const list = bins as { partId?: unknown; colorId?: unknown }[];
      raw = { recentParts: list.map((b) => b?.partId), recentColors: list.map((b) => b?.colorId) } as Partial<Palette>;
      raw.partId = raw.recentParts?.[0];
      raw.colorId = raw.recentColors?.[0];
    }
  }
  if (!raw || typeof raw !== 'object') return DEFAULT_PALETTE;
  return {
    partId: typeof raw.partId === 'string' && isPart(raw.partId) ? raw.partId : DEFAULT_PALETTE.partId,
    colorId: typeof raw.colorId === 'string' && isColor(raw.colorId) ? raw.colorId : DEFAULT_PALETTE.colorId,
    recentParts: validIds(raw.recentParts, isPart, DEFAULT_PALETTE.recentParts),
    recentColors: validIds(raw.recentColors, isColor, DEFAULT_PALETTE.recentColors),
  };
}

export function savePalette(palette: Palette): void {
  write(PALETTE_KEY, JSON.stringify(palette));
}

export function loadSoundEnabled(): boolean {
  return read(SOUND_KEY) !== 'off';
}

export function saveSoundEnabled(on: boolean): void {
  write(SOUND_KEY, on ? 'on' : 'off');
}
