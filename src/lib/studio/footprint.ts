import type { BrickPart, BrickRotation } from '@/types/brick';

/** Exact [cos, sin] for each allowed rotation, avoiding float drift. */
const ROT: Record<BrickRotation, readonly [number, number]> = {
  0: [1, 0],
  90: [0, 1],
  180: [-1, 0],
  270: [0, -1],
};

export const ROTATIONS: BrickRotation[] = [0, 90, 180, 270];

export function nextRotation(r: BrickRotation): BrickRotation {
  return ROTATIONS[(ROTATIONS.indexOf(r) + 1) % 4];
}

/** Footprint in studs after rotation (width along X, depth along Z). */
export function rotatedSize(part: BrickPart, rotation: BrickRotation) {
  return rotation % 180 === 0
    ? { w: part.widthStuds, d: part.depthStuds }
    : { w: part.depthStuds, d: part.widthStuds };
}

/** Whether a part has studs on top. Tiles and slopes are smooth. */
export function hasStuds(part: BrickPart): boolean {
  return part.category !== 'tile' && part.category !== 'slope';
}

export interface WorldCell {
  x: number;
  z: number;
  stud: boolean;
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
      const lx = -part.widthStuds / 2 + i + 0.5;
      const lz = -part.depthStuds / 2 + j + 0.5;
      const wx = lx * c - lz * s;
      const wz = lx * s + lz * c;
      cells.push({ x: Math.floor(cx + wx), z: Math.floor(cz + wz), stud: studs });
    }
  }
  return cells;
}
