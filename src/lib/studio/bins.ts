import { getColor, getPart } from '@/data/brickCatalog';
import { BIN_COUNT } from './constants';

/** One quick-access BuildBin compartment: a part loaded in a color. */
export interface BuildBin {
  partId: string;
  colorId: string;
}

export interface BinKit {
  id: string;
  name: string;
  description: string;
  bins: BuildBin[];
}

export const BIN_KITS: BinKit[] = [
  {
    id: 'starter-mix',
    name: 'Starter Mix',
    description: 'Classic bricks and plates in bright primaries.',
    bins: [
      { partId: 'brick-2x4', colorId: 'bright-red' },
      { partId: 'brick-2x2', colorId: 'bright-blue' },
      { partId: 'brick-1x2', colorId: 'bright-yellow' },
      { partId: 'plate-2x4', colorId: 'forest-green' },
      { partId: 'slope-45-2x2', colorId: 'bright-red' },
      { partId: 'brick-1x1', colorId: 'pure-white' },
    ],
  },
  {
    id: 'space-cruiser',
    name: 'Space Cruiser Parts',
    description: 'Hull plates, sleek slopes, and glowing canopies.',
    bins: [
      { partId: 'plate-2x4', colorId: 'light-stone-gray' },
      { partId: 'slope-45-2x2', colorId: 'pure-white' },
      { partId: 'tile-1x2', colorId: 'obsidian-black' },
      { partId: 'round-1x1', colorId: 'trans-light-blue' },
      { partId: 'brick-1x4', colorId: 'dark-navy' },
      { partId: 'window-1x2', colorId: 'flat-silver' },
    ],
  },
  {
    id: 'castle-masonry',
    name: 'Castle Masonry',
    description: 'Stone walls, arrow slits, and timber trim.',
    bins: [
      { partId: 'brick-1x2', colorId: 'light-stone-gray' },
      { partId: 'brick-2x4', colorId: 'dark-stone-gray' },
      { partId: 'brick-1x1', colorId: 'light-stone-gray' },
      { partId: 'slope-45-1x2', colorId: 'dark-stone-gray' },
      { partId: 'window-1x2', colorId: 'reddish-brown' },
      { partId: 'tile-2x2', colorId: 'sand-tan' },
    ],
  },
];

export const DEFAULT_BINS: BuildBin[] = BIN_KITS[0].bins;

/** Keep only valid bins and pad/trim to exactly BIN_COUNT entries. */
export function sanitizeBins(raw: unknown): BuildBin[] {
  const list = Array.isArray(raw) ? raw : [];
  return Array.from({ length: BIN_COUNT }, (_, i) => {
    const b = list[i] as Partial<BuildBin> | undefined;
    const fallback = DEFAULT_BINS[i];
    return {
      partId: typeof b?.partId === 'string' && getPart(b.partId) ? b.partId : fallback.partId,
      colorId: typeof b?.colorId === 'string' && getColor(b.colorId) ? b.colorId : fallback.colorId,
    };
  });
}
