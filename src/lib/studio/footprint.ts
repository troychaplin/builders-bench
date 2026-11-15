import type { BrickPart, BrickRotation } from '@/types/brick';

/** Exact [cos, sin] for each allowed rotation, avoiding float drift. */
const ROT: Record<BrickRotation, readonly [number, number]> = {
  0: [1, 0],
  90: [0, 1],
  180: [-1, 0],
  270: [0, -1],
};

export const ROTATIONS: BrickRotation[] = [0, 90, 180, 270];

/** The next 90° step: clockwise by default, counter-clockwise with dir −1. */
export function nextRotation(r: BrickRotation, dir: 1 | -1 = 1): BrickRotation {
  return ROTATIONS[(ROTATIONS.indexOf(r) + dir + 4) % 4];
}

/** Footprint in studs after rotation (width along X, depth along Z). */
export function rotatedSize(part: BrickPart, rotation: BrickRotation) {
  return rotation % 180 === 0
    ? { w: part.widthStuds, d: part.depthStuds }
    : { w: part.depthStuds, d: part.widthStuds };
}

/** Whether a part has studs on top. Tiles, slopes and figures are smooth unless the part says otherwise. */
export function hasStuds(part: BrickPart): boolean {
  if (part.studs !== undefined) return part.studs;
  return part.category !== 'tile' && part.category !== 'slope' && part.id !== 'figure';
}

/** Whether the part fills local cell (i, j) of its footprint. */
export function fillsCell(part: BrickPart, i: number, j: number): boolean {
  return !part.missing?.some(([mi, mj]) => mi === i && mj === j);
}

/**
 * Height units of open space under local cell (i, j): the opening of an arch,
 * or the overhang under an inverted slope's front. 0 for solid cells.
 */
export function cellBottom(part: BrickPart, i: number, j: number): number {
  if (part.shape === 'arch') {
    // A one-plate beam spans the opening; the outermost cells are solid legs.
    return j > 0 && j < part.depthStuds - 1 ? part.heightUnits - 1 : 0;
  }
  if (part.shape === 'inverted-slope') {
    // Only the back row reaches the bottom; the front row hangs over open space.
    return j === part.depthStuds - 1 ? part.heightUnits - 1 : 0;
  }
  return 0;
}

export interface WorldCell {
  x: number;
  z: number;
  stud: boolean;
  /** Open space under this cell, in height units above the part's base. */
  bottom: number;
}

/**
 * World stud cells covered by a part whose rotated footprint has its minimum
 * corner at (x0, z0). Rotation is clockwise seen from above, which is a
 * three.js `rotation.y` of −rotation.
 */
export function brickCells(part: BrickPart, x0: number, z0: number, rotation: BrickRotation): WorldCell[] {
  const { w, d } = rotatedSize(part, rotation);
  const cx = x0 + w / 2;
  const cz = z0 + d / 2;
  const [c, s] = ROT[rotation];
  const studs = hasStuds(part);
  const cells: WorldCell[] = [];
  for (let i = 0; i < part.widthStuds; i++) {
    for (let j = 0; j < part.depthStuds; j++) {
      if (!fillsCell(part, i, j)) continue;
      const lx = -part.widthStuds / 2 + i + 0.5;
      const lz = -part.depthStuds / 2 + j + 0.5;
      const wx = lx * c - lz * s;
      const wz = lx * s + lz * c;
      cells.push({ x: Math.floor(cx + wx), z: Math.floor(cz + wz), stud: studs, bottom: cellBottom(part, i, j) });
    }
  }
  return cells;
}
