import { BRICK_COLORS, getColor } from '@/data/brickCatalog';
import { FACTIONS, SLOTS, type ColorKey } from '@/data/figureParts';
import type { BlockFigure } from '@/types/brick';

export const COLOR_KEYS: ColorKey[] = ['headgear', 'head', 'torso', 'arms', 'legs', 'accessory'];

const DEFAULT_COLORS: Record<ColorKey, string> = {
  headgear: 'pure-white',
  head: 'sand-tan',
  torso: 'bright-blue',
  arms: 'bright-blue',
  legs: 'dark-stone-gray',
  accessory: 'light-stone-gray',
};

export function newFigureId(): string {
  return `fig_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultFigure(): BlockFigure {
  return {
    id: newFigureId(),
    name: 'New Recruit',
    hatId: 'space-helmet',
    headId: 'classic-smile',
    torsoId: 'astronaut-suit',
    legsId: 'standard-trousers',
    accessoryId: 'laser-blaster',
    colors: { ...DEFAULT_COLORS },
    faction: 'space',
  };
}

/** Resolve a color key to a catalog color id, falling back to the default. */
export function figureColor(f: BlockFigure, key: ColorKey): string {
  const id = f.colors[key];
  return id && getColor(id) ? id : DEFAULT_COLORS[key];
}

/** Validate untrusted figure JSON (saved list, .figure.json, share links). */
export function sanitizeFigure(raw: unknown): BlockFigure | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Partial<Record<keyof BlockFigure, unknown>>;
  const fig = defaultFigure();

  for (const slot of SLOTS) {
    const v = d[slot.field];
    fig[slot.field] = typeof v === 'string' && slot.parts.some((p) => p.id === v) ? v : slot.parts[0].id;
  }

  const colors = d.colors && typeof d.colors === 'object' ? (d.colors as Record<string, unknown>) : {};
  for (const key of COLOR_KEYS) {
    const c = colors[key];
    fig.colors[key] = typeof c === 'string' && getColor(c) ? c : DEFAULT_COLORS[key];
  }

  if (typeof d.id === 'string' && /^[\w-]{1,64}$/.test(d.id)) fig.id = d.id;
  if (typeof d.name === 'string' && d.name.trim()) fig.name = d.name.trim().slice(0, 32);
  fig.faction = FACTIONS.some((f) => f.id === d.faction) ? (d.faction as string) : 'space';
  return fig;
}

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

const SOLID_AND_METAL = BRICK_COLORS.filter((c) => c.finish !== 'transparent').map((c) => c.id);
const SKIN_TONES = ['sand-tan', 'bright-yellow', 'reddish-brown', 'sunset-orange', 'pure-white', 'light-stone-gray'];

/** A fully random hero (keeps the id and name). */
export function randomFigure(base: BlockFigure): BlockFigure {
  const torso = pick(SOLID_AND_METAL);
  const colors: Record<string, string> = {
    headgear: pick(BRICK_COLORS.map((c) => c.id)),
    head: pick(SKIN_TONES),
    torso,
    arms: Math.random() < 0.6 ? torso : pick(SOLID_AND_METAL),
    legs: pick(SOLID_AND_METAL),
    accessory: pick(BRICK_COLORS.map((c) => c.id)),
  };
  const next: BlockFigure = { ...base, colors, faction: pick(FACTIONS).id };
  for (const slot of SLOTS) next[slot.field] = pick(slot.parts.filter((p) => p.id !== 'none')).id;
  return next;
}

/** Stable, ID-card style number derived from the figure id, e.g. "BB-4F2A-19C". */
export function builderNumber(id: string): string {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hex = (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `BB-${hex.slice(0, 4)}-${hex.slice(4, 7)}`;
}

/* ---------- persistence ---------- */

const FIGURES_KEY = 'builders-bench:figures';
export const FIGURE_EXT = '.figure.json';
const MAX_SAVED = 60;

export function loadFigures(): BlockFigure[] {
  try {
    const raw = window.localStorage.getItem(FIGURES_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.map(sanitizeFigure).filter((f): f is BlockFigure => !!f) : [];
  } catch {
    return [];
  }
}

function writeFigures(list: BlockFigure[]): void {
  try {
    window.localStorage.setItem(FIGURES_KEY, JSON.stringify(list.slice(0, MAX_SAVED)));
  } catch {
    // Storage unavailable — figures still work for this session.
  }
}

/** Insert or update (by id), newest first. Returns the new list. */
export function saveFigure(fig: BlockFigure): BlockFigure[] {
  const list = [fig, ...loadFigures().filter((f) => f.id !== fig.id)];
  writeFigures(list);
  return list;
}

export function deleteFigure(id: string): BlockFigure[] {
  const list = loadFigures().filter((f) => f.id !== id);
  writeFigures(list);
  return list;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'my-figure'
  );
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportFigure(fig: BlockFigure): void {
  downloadBlob(new Blob([JSON.stringify(fig, null, 2)], { type: 'application/json' }), `${slugify(fig.name)}${FIGURE_EXT}`);
}

export async function importFigure(file: File): Promise<BlockFigure | null> {
  if (file.size > 256 * 1024) return null;
  try {
    return sanitizeFigure(JSON.parse(await file.text()));
  } catch {
    return null;
  }
}

export const figureFileSlug = slugify;
