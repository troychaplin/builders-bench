import { NextResponse, type NextRequest } from 'next/server';
import { parseQuery, searchLocal } from '@/lib/sets/query';
import { RebrickableError, searchRebrickable } from '@/lib/sets/rebrickable';

/**
 * GET /api/sets — search the set catalog.
 * Proxies Rebrickable v3 when REBRICKABLE_API_KEY is set (the key never reaches
 * the browser); otherwise filters the built-in featured dataset.
 *
 * Query: q, theme, minYear, maxYear, minPieces, maxPieces, sort, page
 */
export async function GET(request: NextRequest) {
  const query = parseQuery(request.nextUrl.searchParams);
  const key = process.env.REBRICKABLE_API_KEY;

  if (key) {
    try {
      return NextResponse.json(await searchRebrickable(query, key));
    } catch (err) {
      // Fall back so the explorer keeps working if Rebrickable is down or the key is bad.
      const status = err instanceof RebrickableError ? err.status : 502;
      return NextResponse.json({ ...searchLocal(query), fallbackReason: `Rebrickable unavailable (${status})` });
    }
  }

  return NextResponse.json(searchLocal(query));
}
