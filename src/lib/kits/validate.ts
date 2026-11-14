import { getColor, getPart } from '@/data/brickCatalog';
import type { PlacedBrick } from '@/types/brick';
import { BASEPLATE_SIZE } from '@/lib/studio/constants';
import { brickCells, rotatedSize } from '@/lib/studio/footprint';
import { buildOccupancy } from '@/lib/studio/occupancy';
import { buildSteps } from './steps';

/**
 * Check that a build can be assembled in step order under the studio rules:
 * known parts/colors, on the plate, no overlaps, nothing floating, and
 * nothing resting on a smooth tile or slope.
 */
export function validateBuild(bricks: PlacedBrick[]): string[] {
  const errors: string[] = [];
  const placed: PlacedBrick[] = [];

  for (const step of buildSteps(bricks)) {
    // Bricks within one step all sit on earlier steps, so check against those.
    const occ = buildOccupancy(placed);
    for (const b of step) {
      const label = `${b.partId}@(${b.x},${b.y},${b.z}) r${b.rotation}`;
      const part = getPart(b.partId);
      if (!part) {
        errors.push(`${label}: unknown part`);
        continue;
      }
      if (!getColor(b.colorId)) errors.push(`${label}: unknown color ${b.colorId}`);

      const { w, d } = rotatedSize(part, b.rotation);
      if (b.x < 0 || b.z < 0 || b.x + w > BASEPLATE_SIZE || b.z + d > BASEPLATE_SIZE) {
        errors.push(`${label}: off the baseplate`);
      }

      const top = b.y + part.heightUnits;
      let supported = b.y === 0;
      for (const c of brickCells(part, b.x, b.z, b.rotation)) {
        for (const s of occ.get(`${c.x},${c.z}`) ?? []) {
          if (s.y0 < top && b.y < s.y1) errors.push(`${label}: overlaps another brick at (${c.x},${c.z})`);
          if (s.y1 === b.y) {
            if (!s.stud) errors.push(`${label}: rests on a smooth tile or slope at (${c.x},${c.z})`);
            supported = true;
          }
        }
      }
      if (!supported) errors.push(`${label}: floating`);
    }
    // Also catch overlaps between bricks of the same step.
    const stepOcc = buildOccupancy(step);
    for (const [cell, spans] of stepOcc) {
      for (let i = 0; i < spans.length; i++)
        for (let j = i + 1; j < spans.length; j++)
          if (spans[i].y0 < spans[j].y1 && spans[j].y0 < spans[i].y1) errors.push(`step overlap at (${cell})`);
    }
    placed.push(...step);
  }
  return errors;
}
