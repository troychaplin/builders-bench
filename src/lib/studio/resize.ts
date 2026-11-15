import { getPart } from '@/data/brickCatalog';
import type { PlacedBrick, PlacedFigure } from '@/types/brick';
import { FIGURE_PART } from './figures';
import { rotatedSize } from './footprint';

interface Bounds {
  minX: number;
  maxX: number; // exclusive
  minZ: number;
  maxZ: number; // exclusive
}

/** Footprint bounds of everything on the baseplate, or null when it's empty. */
function layoutBounds(bricks: PlacedBrick[], figures: PlacedFigure[]): Bounds | null {
  let b: Bounds | null = null;
  const add = (x: number, z: number, w: number, d: number) => {
    b = b
      ? { minX: Math.min(b.minX, x), maxX: Math.max(b.maxX, x + w), minZ: Math.min(b.minZ, z), maxZ: Math.max(b.maxZ, z + d) }
      : { minX: x, maxX: x + w, minZ: z, maxZ: z + d };
  };
  for (const brick of bricks) {
    const part = getPart(brick.partId);
    if (!part) continue;
    const { w, d } = rotatedSize(part, brick.rotation);
    add(brick.x, brick.z, w, d);
  }
  for (const f of figures) add(f.x, f.z, FIGURE_PART.widthStuds, FIGURE_PART.depthStuds);
  return b;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Move everything onto a baseplate of a new size, keeping the build centred
 * where possible and fully on the plate. Returns null if the build is too big
 * for the new size.
 */
export function resizeLayout(
  bricks: PlacedBrick[],
  figures: PlacedFigure[],
  fromSize: number,
  toSize: number,
): { bricks: PlacedBrick[]; figures: PlacedFigure[] } | null {
  const b = layoutBounds(bricks, figures);
  if (!b) return { bricks, figures };
  if (b.maxX - b.minX > toSize || b.maxZ - b.minZ > toSize) return null;

  // Shift by half the size change so the build stays centred, then nudge it onto the plate.
  const centred = Math.floor((toSize - fromSize) / 2);
  const dx = clamp(centred, -b.minX, toSize - b.maxX);
  const dz = clamp(centred, -b.minZ, toSize - b.maxZ);
  if (dx === 0 && dz === 0) return { bricks, figures };

  return {
    bricks: bricks.map((p) => ({ ...p, x: p.x + dx, z: p.z + dz })),
    figures: figures.map((f) => ({ ...f, x: f.x + dx, z: f.z + dz })),
  };
}
