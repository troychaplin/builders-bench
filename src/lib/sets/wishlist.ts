import type { BrickSet } from '@/types/set';

const KEY = 'builders-bench:wishlist';
export const WISHLIST_FILE = 'dream-set-wishlist.json';
const MAX_SETS = 500;

interface WishlistFile {
  app: 'builders-bench';
  kind: 'wishlist';
  version: 1;
  exportedAt: string;
  sets: BrickSet[];
}

const isStr = (v: unknown, max = 200): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

/** Validate one untrusted set entry (from storage or an imported file). */
export function sanitizeSet(raw: unknown): BrickSet | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  if (!isStr(s.setNum, 40) || !isStr(s.name) || !isInt(s.year) || !isInt(s.pieces) || !isStr(s.theme, 80)) return null;
  const img = typeof s.imageUrl === 'string' && /^https:\/\/cdn\.rebrickable\.com\/media\//.test(s.imageUrl) ? s.imageUrl : null;
  return {
    setNum: s.setNum,
    name: s.name,
    year: s.year,
    theme: s.theme,
    ...(isStr(s.subtheme, 80) ? { subtheme: s.subtheme } : {}),
    pieces: s.pieces,
    imageUrl: img,
  };
}

function sanitizeList(raw: unknown): BrickSet[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: BrickSet[] = [];
  for (const item of raw) {
    const s = sanitizeSet(item);
    if (s && !seen.has(s.setNum)) {
      seen.add(s.setNum);
      out.push(s);
    }
    if (out.length >= MAX_SETS) break;
  }
  return out;
}

export function loadWishlist(): BrickSet[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? sanitizeList(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function saveWishlist(list: BrickSet[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable — export keeps the list safe.
  }
}

export function exportWishlist(list: BrickSet[]): void {
  const file: WishlistFile = { app: 'builders-bench', kind: 'wishlist', version: 1, exportedAt: new Date().toISOString(), sets: list };
  const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = WISHLIST_FILE;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Read an exported wish list (or a bare array of sets). Returns null if invalid. */
export async function importWishlist(file: File): Promise<BrickSet[] | null> {
  if (file.size > 2 * 1024 * 1024) return null;
  try {
    const data = JSON.parse(await file.text()) as unknown;
    const list = Array.isArray(data) ? data : (data as Partial<WishlistFile>)?.sets;
    if (!Array.isArray(list)) return null;
    return sanitizeList(list);
  } catch {
    return null;
  }
}

/** Merge imported sets into the current list (existing entries win, new ones append). */
export function mergeWishlists(current: BrickSet[], incoming: BrickSet[]): BrickSet[] {
  const have = new Set(current.map((s) => s.setNum));
  return [...current, ...incoming.filter((s) => !have.has(s.setNum))].slice(0, MAX_SETS);
}
