import { FEATURED_SETS } from '@/data/featuredSets';
import type { BrickSet, SetQuery, SetSearchResponse, SetSort } from '@/types/set';

export const PAGE_SIZE = 48;
export const MIN_YEAR = 1949;

/** Latest selectable year (call on the client; avoids prerender-time clocks). */
export function maxYear(): number {
  return new Date().getFullYear() + 1;
}

/** Piece-count slider stops; the last stop means "5,000+" (no upper bound). */
export const PIECE_STOPS = [0, 200, 500, 1000, 2000, 3000, 5000, Infinity] as const;

export function pieceStopLabel(i: number): string {
  const v = PIECE_STOPS[i];
  if (i === 0) return '0';
  if (v === Infinity) return '5,000+';
  return v.toLocaleString('en-US');
}

const SORTS: SetSort[] = ['newest', 'oldest', 'pieces-desc', 'pieces-asc', 'name'];

const int = (v: string | null) => {
  if (v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
};

/** Parse and clamp a query from URL search params (shared by the page URL and the API). */
export function parseQuery(sp: URLSearchParams): SetQuery {
  const sort = sp.get('sort') as SetSort | null;
  return {
    search: sp.get('q')?.trim().slice(0, 80) || undefined,
    theme: sp.get('theme')?.slice(0, 80) || undefined,
    minYear: int(sp.get('minYear')),
    maxYear: int(sp.get('maxYear')),
    minPieces: int(sp.get('minPieces')),
    maxPieces: int(sp.get('maxPieces')),
    sort: sort && SORTS.includes(sort) ? sort : undefined,
    page: Math.max(1, int(sp.get('page')) ?? 1),
  };
}

export function queryToParams(q: SetQuery): URLSearchParams {
  const sp = new URLSearchParams();
  if (q.search) sp.set('q', q.search);
  if (q.theme) sp.set('theme', q.theme);
  if (q.minYear !== undefined) sp.set('minYear', String(q.minYear));
  if (q.maxYear !== undefined) sp.set('maxYear', String(q.maxYear));
  if (q.minPieces) sp.set('minPieces', String(q.minPieces));
  if (q.maxPieces !== undefined) sp.set('maxPieces', String(q.maxPieces));
  if (q.sort && q.sort !== 'newest') sp.set('sort', q.sort);
  if (q.page && q.page > 1) sp.set('page', String(q.page));
  return sp;
}

/** "75192-1" → "75192" (the number LEGO uses for building instructions). */
export function baseSetNumber(setNum: string): string {
  return setNum.replace(/-\d+$/, '');
}

export function instructionsUrl(setNum: string): string {
  return `https://www.lego.com/service/buildinginstructions/${encodeURIComponent(baseSetNumber(setNum))}`;
}

export function rebrickableUrl(setNum: string): string {
  return `https://rebrickable.com/sets/${encodeURIComponent(setNum)}/`;
}

export function compareSets(sort: SetSort = 'newest') {
  return (a: BrickSet, b: BrickSet) => {
    switch (sort) {
      case 'oldest':
        return a.year - b.year || a.name.localeCompare(b.name);
      case 'pieces-desc':
        return b.pieces - a.pieces;
      case 'pieces-asc':
        return a.pieces - b.pieces;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return b.year - a.year || b.pieces - a.pieces;
    }
  };
}

/** Filter the built-in dataset (used when no Rebrickable key is configured). */
export function searchLocal(q: SetQuery): SetSearchResponse {
  const needle = q.search?.toLowerCase();
  const matches = FEATURED_SETS.filter((s) => {
    if (needle) {
      const hay = `${s.name} ${s.setNum} ${s.theme} ${s.subtheme ?? ''}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    if (q.theme && s.theme !== q.theme) return false;
    if (q.minYear !== undefined && s.year < q.minYear) return false;
    if (q.maxYear !== undefined && s.year > q.maxYear) return false;
    if (q.minPieces !== undefined && s.pieces < q.minPieces) return false;
    if (q.maxPieces !== undefined && s.pieces > q.maxPieces) return false;
    return true;
  }).sort(compareSets(q.sort));

  const page = q.page ?? 1;
  const start = (page - 1) * PAGE_SIZE;
  return {
    source: 'local',
    count: matches.length,
    page,
    hasMore: start + PAGE_SIZE < matches.length,
    results: matches.slice(start, start + PAGE_SIZE),
    themes: [...new Set(FEATURED_SETS.map((s) => s.theme))].sort(),
  };
}
