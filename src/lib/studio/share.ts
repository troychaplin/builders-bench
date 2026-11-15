import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { getColor, getPart } from '@/data/brickCatalog';
import type { BlockFigure, BrickRotation, BuildProject, PlacedBrick, PlacedFigure } from '@/types/brick';
import { COLOR_KEYS, sanitizeFigure } from '@/lib/figures/figure';
import { getBaseplateColor, MAX_HEIGHT_UNITS, normalizeBaseplateSize } from './constants';
import { FIGURE_PART } from './figures';
import { rotatedSize, ROTATIONS } from './footprint';

export const HASH_PREFIX = '#build=';

export function newInstanceId(): string {
  return `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

const isInt = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n);
const str = (v: unknown, max: number, fallback: string) =>
  typeof v === 'string' && v.trim() ? v.slice(0, max) : fallback;

/** Validate one brick against the catalog and the baseplate bounds. */
function sanitizeBrick(
  size: number,
  partId: unknown,
  colorId: unknown,
  x: unknown,
  y: unknown,
  z: unknown,
  rotation: unknown,
): PlacedBrick | null {
  const part = typeof partId === 'string' ? getPart(partId) : undefined;
  if (!part || typeof colorId !== 'string' || !getColor(colorId)) return null;
  if (![x, y, z].every(isInt) || !ROTATIONS.includes(rotation as BrickRotation)) return null;
  const r = rotation as BrickRotation;
  const [bx, by, bz] = [x, y, z] as number[];
  const { w, d } = rotatedSize(part, r);
  if (bx < 0 || bz < 0 || by < 0 || bx + w > size || bz + d > size) return null;
  if (by + part.heightUnits > MAX_HEIGHT_UNITS) return null;
  return { instanceId: newInstanceId(), partId: part.id, colorId, x: bx, y: by, z: bz, rotation: r };
}

function sanitizePlacedFigure(raw: unknown, size: number): PlacedFigure | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<Record<keyof PlacedFigure, unknown>>;
  const figure = sanitizeFigure(p.figure);
  if (!figure || ![p.x, p.y, p.z].every(isInt) || !ROTATIONS.includes(p.rotation as BrickRotation)) return null;
  const [x, y, z] = [p.x, p.y, p.z] as number[];
  if (x < 0 || z < 0 || y < 0 || x + 2 > size || z + 2 > size) return null;
  if (y + FIGURE_PART.heightUnits > MAX_HEIGHT_UNITS) return null;
  return { instanceId: newInstanceId(), figure, x, y, z, rotation: p.rotation as BrickRotation };
}

/**
 * Turn untrusted JSON (a cartridge file or decoded share link) into a valid
 * project. Unknown parts/colors and out-of-bounds bricks are dropped.
 */
export function sanitizeProject(raw: unknown): BuildProject | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<Record<keyof BuildProject, unknown>>;
  if (!Array.isArray(data.bricks)) return null;
  const size = normalizeBaseplateSize(data.baseplateSize);

  const bricks: PlacedBrick[] = [];
  for (const b of data.bricks) {
    if (!b || typeof b !== 'object') continue;
    const p = b as Partial<Record<keyof PlacedBrick, unknown>>;
    const clean = sanitizeBrick(size, p.partId, p.colorId, p.x, p.y, p.z, p.rotation);
    if (clean) bricks.push(clean);
  }

  const figures = Array.isArray(data.figures)
    ? data.figures.map((f) => sanitizePlacedFigure(f, size)).filter((f): f is PlacedFigure => !!f)
    : [];

  return {
    id: str(data.id, 64, newInstanceId()),
    title: str(data.title, 80, 'Untitled Build'),
    author: str(data.author, 60, 'Anonymous'),
    createdAt: str(data.createdAt, 40, new Date().toISOString()),
    baseplateSize: size,
    baseplateColor: getBaseplateColor(typeof data.baseplateColor === 'string' ? data.baseplateColor : undefined).id,
    bricks,
    ...(figures.length ? { figures } : {}),
  };
}

/* ---------- URL hash (compact tuples + lz-string) ---------- */

/** [partId, colorId, x, y, z, rotation / 90] */
type BrickTuple = [string, string, number, number, number, number];

/** [name, hat, head, torso, legs, accessory, colors (COLOR_KEYS order), faction, x, y, z, rotation / 90] */
type FigureTuple = [string, string, string, string, string, string, string[], string, number, number, number, number];

interface SharePayload {
  v: 1;
  t: string;
  a: string;
  c: string;
  /** Baseplate size (omitted for the default 24). */
  s?: number;
  b: BrickTuple[];
  f?: FigureTuple[];
}

function figureToTuple(p: PlacedFigure): FigureTuple {
  const f = p.figure;
  return [f.name, f.hatId, f.headId, f.torsoId, f.legsId, f.accessoryId, COLOR_KEYS.map((k) => f.colors[k]), f.faction ?? 'space', p.x, p.y, p.z, p.rotation / 90];
}

function tupleToFigure(t: unknown[]): unknown {
  const [name, hatId, headId, torsoId, legsId, accessoryId, colors, faction, x, y, z, r] = t;
  const figure: Partial<BlockFigure> = {
    name: name as string,
    hatId: hatId as string,
    headId: headId as string,
    torsoId: torsoId as string,
    legsId: legsId as string,
    accessoryId: accessoryId as string,
    faction: faction as string,
    colors: Array.isArray(colors) ? Object.fromEntries(COLOR_KEYS.map((k, i) => [k, colors[i]])) : {},
  };
  return { figure, x, y, z, rotation: isInt(r) ? r * 90 : -1 };
}

export function encodeProject(p: BuildProject): string {
  const payload: SharePayload = {
    v: 1,
    t: p.title,
    a: p.author,
    c: getBaseplateColor(p.baseplateColor).id,
    ...(p.baseplateSize !== 24 ? { s: p.baseplateSize } : {}),
    b: p.bricks.map((b) => [b.partId, b.colorId, b.x, b.y, b.z, b.rotation / 90]),
  };
  if (p.figures?.length) payload.f = p.figures.map(figureToTuple);
  return compressToEncodedURIComponent(JSON.stringify(payload));
}

export function decodeProject(encoded: string): BuildProject | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const data = JSON.parse(json) as Partial<SharePayload>;
    if (data.v !== 1 || !Array.isArray(data.b)) return null;
    return sanitizeProject({
      title: data.t,
      author: data.a,
      baseplateColor: data.c,
      baseplateSize: data.s,
      bricks: data.b
        .filter((t): t is BrickTuple => Array.isArray(t) && t.length === 6)
        .map(([partId, colorId, x, y, z, r]) => ({ partId, colorId, x, y, z, rotation: isInt(r) ? r * 90 : -1 })),
      figures: Array.isArray(data.f) ? data.f.filter((t) => Array.isArray(t) && t.length === 12).map(tupleToFigure) : [],
    });
  } catch {
    return null;
  }
}

export function shareUrl(p: BuildProject): string {
  return `${window.location.origin}${window.location.pathname}${HASH_PREFIX}${encodeProject(p)}`;
}

export function readHashProject(): BuildProject | null {
  const hash = window.location.hash;
  return hash.startsWith(HASH_PREFIX) ? decodeProject(hash.slice(HASH_PREFIX.length)) : null;
}

/* ---------- .brick.json cartridges ---------- */

export const CARTRIDGE_EXT = '.brick.json';

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug && slug !== 'untitled-build' ? slug : 'my-creation';
}

/** Trigger a download of the project as a pretty-printed `.brick.json` file. */
export function downloadCartridge(p: BuildProject): void {
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(p.title)}${CARTRIDGE_EXT}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const MAX_CARTRIDGE_BYTES = 5 * 1024 * 1024;

export async function readCartridge(file: File): Promise<BuildProject | null> {
  if (file.size > MAX_CARTRIDGE_BYTES) return null;
  try {
    return sanitizeProject(JSON.parse(await file.text()));
  } catch {
    return null;
  }
}
