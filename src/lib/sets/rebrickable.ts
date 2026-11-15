// Server-only: imported solely by the /api/sets route handler (keeps the API key off the client).
import type { BrickSet, SetQuery, SetSearchResponse, SetSort } from '@/types/set';
import { PAGE_SIZE } from './query';

const API = 'https://rebrickable.com/api/v3/lego';

interface RbTheme {
  id: number;
  name: string;
  parent_id: number | null;
}

interface RbSet {
  set_num: string;
  name: string;
  year: number;
  theme_id: number;
  num_parts: number;
  set_img_url: string | null;
}

interface RbPage<T> {
  count: number;
  next: string | null;
  results: T[];
}

export class RebrickableError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function rb<T>(path: string, key: string, revalidate: number): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `key ${key}`, Accept: 'application/json' },
    next: { revalidate },
  });
  if (!res.ok) throw new RebrickableError(`Rebrickable responded ${res.status}`, res.status);
  return (await res.json()) as T;
}

/** All themes, cached for a day. */
async function themes(key: string): Promise<Map<number, RbTheme>> {
  const all: RbTheme[] = [];
  let page = 1;
  for (;;) {
    const data = await rb<RbPage<RbTheme>>(`/themes/?page_size=1000&page=${page}`, key, 86_400);
    all.push(...data.results);
    if (!data.next || page >= 5) break;
    page++;
  }
  return new Map(all.map((t) => [t.id, t]));
}

function rootOf(map: Map<number, RbTheme>, id: number): { top: string; own: string } {
  let t = map.get(id);
  const own = t?.name ?? 'Unknown';
  while (t?.parent_id) t = map.get(t.parent_id) ?? undefined;
  return { top: t?.name ?? own, own };
}

const ORDERING: Record<SetSort, string> = {
  newest: '-year',
  oldest: 'year',
  'pieces-desc': '-num_parts',
  'pieces-asc': 'num_parts',
  name: 'name',
};

/** Live search against Rebrickable v3, mapped into the explorer's shape. */
export async function searchRebrickable(q: SetQuery, key: string): Promise<SetSearchResponse> {
  const themeMap = await themes(key);
  const topThemes = [...themeMap.values()].filter((t) => t.parent_id === null);

  const sp = new URLSearchParams({ page_size: String(PAGE_SIZE), page: String(q.page ?? 1), ordering: ORDERING[q.sort ?? 'newest'] });
  if (q.search) sp.set('search', q.search);
  if (q.minYear !== undefined) sp.set('min_year', String(q.minYear));
  if (q.maxYear !== undefined) sp.set('max_year', String(q.maxYear));
  if (q.minPieces) sp.set('min_parts', String(q.minPieces));
  if (q.maxPieces !== undefined) sp.set('max_parts', String(q.maxPieces));
  if (q.theme) {
    const theme = topThemes.find((t) => t.name === q.theme);
    if (theme) sp.set('theme_id', String(theme.id));
  }

  const data = await rb<RbPage<RbSet>>(`/sets/?${sp}`, key, 3_600);
  const results: BrickSet[] = data.results.map((s) => {
    const { top, own } = rootOf(themeMap, s.theme_id);
    return {
      setNum: s.set_num,
      name: s.name,
      year: s.year,
      theme: top,
      ...(own !== top ? { subtheme: own } : {}),
      pieces: s.num_parts,
      imageUrl: s.set_img_url,
    };
  });

  return {
    source: 'rebrickable',
    count: data.count,
    page: q.page ?? 1,
    hasMore: Boolean(data.next),
    results,
    themes: topThemes.map((t) => t.name).sort(),
  };
}
