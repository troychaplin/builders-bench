/**
 * Check every starter kit can be assembled step by step under the studio rules.
 * Run with: npx tsx scripts/validate-kits.ts
 */
import { STARTER_KITS } from '../src/data/starterKits';
import { buildSteps } from '../src/lib/kits/steps';
import { validateBuild } from '../src/lib/kits/validate';

let failed = false;
for (const kit of STARTER_KITS) {
  const errors = validateBuild(kit.project.bricks);
  const steps = buildSteps(kit.project.bricks).length;
  const status = errors.length ? 'FAIL' : 'ok';
  console.log(`${status.padEnd(4)} ${kit.project.title} — ${kit.project.bricks.length} pieces, ${steps} steps`);
  for (const e of errors) console.log(`     ${e}`);
  if (errors.length) failed = true;
}
process.exit(failed ? 1 : 0);
