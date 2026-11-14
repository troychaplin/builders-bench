import { getPart } from '@/data/brickCatalog';
import type { BrickPart, BrickRotation, PlacedBrick } from '@/types/brick';
import { MAX_HEIGHT_UNITS } from './constants';
import { brickCells, rotatedSize } from './footprint';

/** A vertical slice of one stud column occupied by a brick: [y0, y1) in height units. */
export interface Span {
  y0: number;
  y1: number;
  stud: boolean;
  id: string;
}

export type Occupancy = Map<string, Span[]>;

const key = (x: number, z: number) => `${x},${z}`;

export function buildOccupancy(bricks: PlacedBrick[]): Occupancy {
  const occ: Occupancy = new Map();
  for (const b of bricks) {
    const part = getPart(b.partId);
    if (!part) continue;
    for (const cell of brickCells(part, b.x, b.z, b.rotation)) {
      const k = key(cell.x, cell.z);
      const list = occ.get(k) ?? [];
      list.push({ y0: b.y, y1: b.y + part.heightUnits, stud: cell.stud, id: b.instanceId });
      occ.set(k, list);
    }
  }
  return occ;
}

function columnTop(occ: Occupancy, x: number, z: number): number {
  const spans = occ.get(key(x, z));
  if (!spans) return 0;
  let top = 0;
  for (const s of spans) top = Math.max(top, s.y1);
  return top;
}

export interface Placement {
  x: number;
  y: number;
  z: number;
  valid: boolean;
  reason?: string;
}

/**
 * Where a part would land if dropped onto the anchor cell under the pointer.
 * The footprint is centred on the anchor and clamped to the baseplate; the
 * part rests on the highest surface beneath it. Every column it touches at
 * that height must offer a stud (tiles and sloped faces don't).
 */
export function resolvePlacement(
  occ: Occupancy,
  part: BrickPart,
  rotation: BrickRotation,
  anchorX: number,
  anchorZ: number,
  baseplateSize: number,
): Placement | null {
  const { w, d } = rotatedSize(part, rotation);
  if (w > baseplateSize || d > baseplateSize) return null;

  const x = Math.min(Math.max(anchorX - Math.floor((w - 1) / 2), 0), baseplateSize - w);
  const z = Math.min(Math.max(anchorZ - Math.floor((d - 1) / 2), 0), baseplateSize - d);
  const cells = brickCells(part, x, z, rotation);

  let y = 0;
  for (const c of cells) y = Math.max(y, columnTop(occ, c.x, c.z));

  if (y > 0) {
    for (const c of cells) {
      const support = occ.get(key(c.x, c.z))?.find((s) => s.y1 === y);
      if (support && !support.stud) {
        return { x, y, z, valid: false, reason: 'Nothing can connect to a smooth tile or slope.' };
      }
    }
  }

  if (y + part.heightUnits > MAX_HEIGHT_UNITS) {
    return { x, y, z, valid: false, reason: 'That would exceed the maximum build height.' };
  }

  return { x, y, z, valid: true };
}

/** True when another brick sits directly on top of this one. */
export function isSupportingOthers(occ: Occupancy, brick: PlacedBrick): boolean {
  const part = getPart(brick.partId);
  if (!part) return false;
  const top = brick.y + part.heightUnits;
  return brickCells(part, brick.x, brick.z, brick.rotation).some((c) =>
    occ.get(key(c.x, c.z))?.some((s) => s.y0 === top && s.id !== brick.instanceId),
  );
}
