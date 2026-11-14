import type { PlacedBrick } from '@/types/brick';

export const MAX_BRICKS_PER_STEP = 3;

/**
 * Turn a build into instruction steps: bottom layer first, then upward.
 * Bricks on the same layer that share a part and color are grouped, up to
 * three per step, so each step reads like a printed manual page.
 */
export function buildSteps(bricks: PlacedBrick[]): PlacedBrick[][] {
  const sorted = [...bricks].sort(
    (a, b) =>
      a.y - b.y ||
      a.partId.localeCompare(b.partId) ||
      a.colorId.localeCompare(b.colorId) ||
      a.z - b.z ||
      a.x - b.x,
  );

  // Runs of identical pieces on the same layer…
  const runs: PlacedBrick[][] = [];
  for (const b of sorted) {
    const run = runs.at(-1);
    const head = run?.[0];
    if (run && head && head.y === b.y && head.partId === b.partId && head.colorId === b.colorId) run.push(b);
    else runs.push([b]);
  }

  // …split into evenly sized steps (4 → 2+2, 5 → 3+2) rather than 3+1.
  const steps: PlacedBrick[][] = [];
  for (const run of runs) {
    const chunks = Math.ceil(run.length / MAX_BRICKS_PER_STEP);
    let start = 0;
    for (let i = 0; i < chunks; i++) {
      const size = Math.ceil((run.length - start) / (chunks - i));
      steps.push(run.slice(start, start + size));
      start += size;
    }
  }
  return steps;
}

export interface StepPart {
  partId: string;
  colorId: string;
  count: number;
}

/** "Parts needed" call-out for one step. */
export function stepParts(step: PlacedBrick[]): StepPart[] {
  const map = new Map<string, StepPart>();
  for (const b of step) {
    const key = `${b.partId}|${b.colorId}`;
    const entry = map.get(key) ?? { partId: b.partId, colorId: b.colorId, count: 0 };
    entry.count++;
    map.set(key, entry);
  }
  return [...map.values()];
}
