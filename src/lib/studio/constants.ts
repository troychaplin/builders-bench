/** World units: 1 stud pitch = 1 unit horizontally. */
export const UNIT_H = 0.4; // world height of one plate (1 height unit)
export const STUD_RADIUS = 0.3;
export const STUD_HEIGHT = 0.18;
export const GAP = 0.02; // visual seam between neighbouring bricks

/** Baseplate sizes the studio offers, in studs per side. */
export const BASEPLATE_SIZES = [16, 24, 32, 48, 64] as const;
export const DEFAULT_BASEPLATE_SIZE = 24;
/** Fixed size used by the built-in guided kits. */
export const BASEPLATE_SIZE = DEFAULT_BASEPLATE_SIZE;

export function normalizeBaseplateSize(size: unknown): number {
  return (BASEPLATE_SIZES as readonly number[]).includes(size as number) ? (size as number) : DEFAULT_BASEPLATE_SIZE;
}

export interface BaseplateColor {
  id: string;
  name: string;
  hex: string;
}

export const BASEPLATE_COLORS: BaseplateColor[] = [
  { id: 'forest-green', name: 'Forest Green', hex: '#237841' },
  { id: 'desert-tan', name: 'Desert Tan', hex: '#C9B08A' },
  { id: 'stone-gray', name: 'Stone Gray', hex: '#A0A5A9' },
  { id: 'deep-space-black', name: 'Deep Space Black', hex: '#1E2329' },
];

export const DEFAULT_BASEPLATE_COLOR = 'forest-green';

export function getBaseplateColor(id: string | undefined): BaseplateColor {
  return BASEPLATE_COLORS.find((c) => c.id === id) ?? BASEPLATE_COLORS[0];
}

/** Tallest a build may go, in height units (≈ 30 bricks). */
export const MAX_HEIGHT_UNITS = 90;

export const HISTORY_LIMIT = 100;

export const BIN_COUNT = 6;
