import { getColor, getPart } from '@/data/brickCatalog';
import type { PlacedBrick } from '@/types/brick';
import { rotatedSize } from '@/lib/studio/footprint';

const COS30 = Math.cos(Math.PI / 6);
const H_UNIT = 0.4; // plate height in stud pitches

function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(c * (1 - amount));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

interface Box {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  y0: number;
  y1: number;
  hex: string;
  alpha: number;
}

/** Static isometric preview of a build, drawn as shaded boxes (server-renderable). */
export default function KitThumbnail({ bricks, className = 'w-full' }: { bricks: PlacedBrick[]; className?: string }) {
  const boxes: Box[] = [];
  for (const b of bricks) {
    const part = getPart(b.partId);
    const color = getColor(b.colorId);
    if (!part || !color) continue;
    const { w, d } = rotatedSize(part, b.rotation);
    boxes.push({
      x0: b.x,
      z0: b.z,
      x1: b.x + w,
      z1: b.z + d,
      y0: b.y * H_UNIT,
      y1: (b.y + part.heightUnits) * H_UNIT,
      hex: color.hex,
      alpha: color.finish === 'transparent' ? 0.7 : 1,
    });
  }
  if (!boxes.length) return null;

  // Painter's order: lower first, then back-to-front.
  boxes.sort((a, b) => a.y0 - b.y0 || a.x0 + a.z0 - (b.x0 + b.z0));

  const iso = (x: number, y: number, z: number): [number, number] => [(x - z) * COS30, (x + z) * 0.5 - y];
  const pts = (...p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const bx of boxes) {
    for (const [x, y, z] of [
      [bx.x0, bx.y0, bx.z0], [bx.x1, bx.y0, bx.z0], [bx.x0, bx.y0, bx.z1], [bx.x1, bx.y0, bx.z1],
      [bx.x0, bx.y1, bx.z0], [bx.x1, bx.y1, bx.z1],
    ] as [number, number, number][]) {
      const [px, py] = iso(x, y, z);
      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    }
  }
  const pad = 0.8;
  const vb = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;

  return (
    <svg viewBox={vb} className={className} aria-hidden="true" strokeLinejoin="round">
      {boxes.map((b, i) => (
        <g key={i} stroke="#0F172A" strokeWidth={0.06} opacity={b.alpha}>
          <polygon points={pts(iso(b.x0, b.y1, b.z0), iso(b.x1, b.y1, b.z0), iso(b.x1, b.y1, b.z1), iso(b.x0, b.y1, b.z1))} fill={b.hex} />
          <polygon points={pts(iso(b.x0, b.y1, b.z1), iso(b.x1, b.y1, b.z1), iso(b.x1, b.y0, b.z1), iso(b.x0, b.y0, b.z1))} fill={shade(b.hex, 0.16)} />
          <polygon points={pts(iso(b.x1, b.y1, b.z0), iso(b.x1, b.y1, b.z1), iso(b.x1, b.y0, b.z1), iso(b.x1, b.y0, b.z0))} fill={shade(b.hex, 0.32)} />
        </g>
      ))}
    </svg>
  );
}
