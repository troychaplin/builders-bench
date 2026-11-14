/** Master Builder Badges, kept per kit in localStorage. */

const BADGES_KEY = 'builders-bench:badges';
export const CUSTOM_KIT_ID = 'custom';

export interface Badge {
  kitId: string;
  title: string;
  earnedAt: string;
  completions: number;
}

export type BadgeBook = Record<string, Badge>;

export function loadBadges(): BadgeBook {
  try {
    const raw = window.localStorage.getItem(BADGES_KEY);
    const data = raw ? (JSON.parse(raw) as unknown) : null;
    return data && typeof data === 'object' && !Array.isArray(data) ? (data as BadgeBook) : {};
  } catch {
    return {};
  }
}

/** Record a completion; the first one earns the badge. Returns the updated badge. */
export function awardBadge(kitId: string, title: string): Badge {
  const book = loadBadges();
  const prev = book[kitId];
  const badge: Badge = prev
    ? { ...prev, completions: (prev.completions ?? 1) + 1 }
    : { kitId, title, earnedAt: new Date().toISOString(), completions: 1 };
  book[kitId] = badge;
  try {
    window.localStorage.setItem(BADGES_KEY, JSON.stringify(book));
  } catch {
    // Storage unavailable — the badge still shows for this session.
  }
  return badge;
}
