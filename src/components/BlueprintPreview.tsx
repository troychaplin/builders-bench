'use client';

import { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { getColor } from '@/data/brickCatalog';

/* ---------- isometric helpers ---------- */

const GRID = 24; // baseplate size in studs
const S = 12; // px per stud
const CX = 300;
const CY = 205;
const BRICK_H = 1.2; // brick height in stud pitches (9.6mm / 8mm)
const STUD_R = 0.3;
const STUD_H = 0.2;
const COS30 = Math.cos(Math.PI / 6);

type Pt = [number, number];

function iso(x: number, y: number, z: number): Pt {
  return [CX + (x - z) * COS30 * S, CY + (x + z - GRID) * 0.5 * S - y * S];
}

const pts = (...p: Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(c * (1 - amount));
  return `rgb(${f((n >> 16) & 255)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

interface Box {
  id: string;
  x0: number;
  z0: number;
  w: number;
  d: number;
  level: number;
  active?: boolean;
}

/** Back-to-front painter order for non-overlapping boxes. */
function paintOrder(p: Box, q: Box): number {
  if (p.level !== q.level) return p.level - q.level;
  if (p.x0 + p.w <= q.x0 || p.z0 + p.d <= q.z0) return -1;
  if (q.x0 + q.w <= p.x0 || q.z0 + q.d <= p.z0) return 1;
  return 0;
}

/* ---------- component ---------- */

const SWATCH_IDS = ['bright-blue', 'bright-red', 'bright-yellow', 'forest-green', 'sunset-orange', 'obsidian-black'];

export default function BlueprintPreview() {
  const swatches = SWATCH_IDS.map((id) => getColor(id)!);
  const [colorId, setColorId] = useState(swatches[0].id);
  const [rotated, setRotated] = useState(false);
  const color = getColor(colorId)!;

  const boxes: Box[] = [
    { id: 'a', x0: 6, z0: 10, w: 6, d: 2, level: 0 },
    { id: 'b', x0: 12, z0: 10, w: 6, d: 2, level: 0 },
    { id: 'e', x0: 10, z0: 12, w: 4, d: 2, level: 0 },
    { id: 'd', x0: 15, z0: 10, w: 2, d: 2, level: 1 },
    rotated
      ? { id: 'c', x0: 11, z0: 10, w: 2, d: 4, level: 1, active: true }
      : { id: 'c', x0: 10, z0: 11, w: 4, d: 2, level: 1, active: true },
  ].sort(paintOrder);

  const covered = (b: Box, sx: number, sz: number) =>
    boxes.some(
      (o) => o.level === b.level + 1 && sx > o.x0 && sx < o.x0 + o.w && sz > o.z0 && sz < o.z0 + o.d,
    );

  const rx = STUD_R * S * Math.SQRT2 * COS30;
  const ry = STUD_R * S * Math.SQRT2 * 0.5;

  return (
    <div className="reg-marks border border-ink/15 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04),0_20px_40px_-24px_rgba(15,23,42,0.25)]">
      <span className="reg reg-tl" /><span className="reg reg-tr" />
      <span className="reg reg-bl" /><span className="reg reg-br" />

      {/* header strip */}
      <div className="flex items-center justify-between border-b border-ink/15 px-4 py-2.5 font-mono text-[10px] tracking-[0.16em] text-ink-soft">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald" aria-hidden="true" />
          FIG. 01 — ISOMETRIC PREVIEW
        </span>
        <span>SCALE 1:1</span>
      </div>

      <svg viewBox="0 0 600 390" className="block w-full" role="img" aria-label={`Isometric diagram of a brick in ${color.name} on a 24 by 24 stud grid`}>
        <defs>
          <marker id="dim-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 1 L10 5 L0 9" fill="none" stroke="var(--cobalt)" strokeWidth="1.5" />
          </marker>
        </defs>

        {/* baseplate grid */}
        <polygon points={pts(iso(0, 0, 0), iso(GRID, 0, 0), iso(GRID, 0, GRID), iso(0, 0, GRID))} fill="rgba(37,99,235,0.04)" stroke="var(--ink)" strokeWidth="1.25" />
        {Array.from({ length: GRID - 1 }, (_, i) => i + 1).map((i) => {
          const major = i % 4 === 0;
          const stroke = major ? 'rgba(37,99,235,0.35)' : 'rgba(148,163,184,0.35)';
          const [ax, ay] = iso(i, 0, 0);
          const [bx, by] = iso(i, 0, GRID);
          const [cx, cy] = iso(0, 0, i);
          const [dx, dy] = iso(GRID, 0, i);
          return (
            <g key={i} stroke={stroke} strokeWidth={major ? 0.9 : 0.5}>
              <line x1={ax} y1={ay} x2={bx} y2={by} />
              <line x1={cx} y1={cy} x2={dx} y2={dy} />
            </g>
          );
        })}

        {/* bricks */}
        {boxes.map((b) => {
          const y0 = b.level * BRICK_H;
          const y1 = y0 + BRICK_H;
          const x1 = b.x0 + b.w;
          const z1 = b.z0 + b.d;
          const top = b.active ? color.hex : '#ffffff';
          const left = b.active ? shade(color.hex, 0.18) : '#f1f5f9';
          const right = b.active ? shade(color.hex, 0.34) : '#e2e8f0';
          const stroke = 'var(--ink)';

          const studs: Pt[] = [];
          for (let sx = b.x0 + 0.5; sx < x1; sx++) for (let sz = b.z0 + 0.5; sz < z1; sz++) if (!covered(b, sx, sz)) studs.push([sx, sz]);
          studs.sort((p, q) => p[0] + p[1] - (q[0] + q[1]));

          return (
            <g key={b.id} strokeLinejoin="round" style={{ transition: 'fill 200ms' }}>
              <polygon points={pts(iso(b.x0, y1, b.z0), iso(x1, y1, b.z0), iso(x1, y1, z1), iso(b.x0, y1, z1))} fill={top} stroke={stroke} strokeWidth="1.25" />
              <polygon points={pts(iso(b.x0, y1, z1), iso(x1, y1, z1), iso(x1, y0, z1), iso(b.x0, y0, z1))} fill={left} stroke={stroke} strokeWidth="1.25" />
              <polygon points={pts(iso(x1, y1, b.z0), iso(x1, y1, z1), iso(x1, y0, z1), iso(x1, y0, b.z0))} fill={right} stroke={stroke} strokeWidth="1.25" />
              {studs.map(([sx, sz]) => {
                const [bx, by] = iso(sx, y1, sz);
                const ty = by - STUD_H * S;
                return (
                  <g key={`${sx}-${sz}`} stroke={stroke} strokeWidth="1">
                    <path d={`M${bx - rx} ${ty} V${by} A${rx} ${ry} 0 0 0 ${bx + rx} ${by} V${ty}`} fill={left} />
                    <ellipse cx={bx} cy={ty} rx={rx} ry={ry} fill={top} />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* dimension: 24 STUDS along front-left edge */}
        {(() => {
          const off = 2.2;
          const [ax, ay] = iso(0, 0, GRID + off);
          const [bx, by] = iso(GRID, 0, GRID + off);
          const [ex1, ey1] = iso(0, 0, GRID);
          const [ex2, ey2] = iso(GRID, 0, GRID);
          const mx = (ax + bx) / 2;
          const my = (ay + by) / 2;
          return (
            <g>
              <line x1={ex1} y1={ey1} x2={ax} y2={ay + 4} stroke="var(--cobalt)" strokeWidth="0.75" strokeDasharray="2 2" />
              <line x1={ex2} y1={ey2} x2={bx} y2={by + 4} stroke="var(--cobalt)" strokeWidth="0.75" strokeDasharray="2 2" />
              <line x1={ax} y1={ay} x2={bx} y2={by} stroke="var(--cobalt)" strokeWidth="1" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
              <g transform={`translate(${mx} ${my}) rotate(30)`}>
                <rect x="-34" y="-8" width="68" height="16" fill="#fff" />
                <text textAnchor="middle" dy="3.5" className="font-mono" fontSize="10" letterSpacing="1.5" fill="var(--cobalt)">24 STUDS</text>
              </g>
            </g>
          );
        })()}

        {/* leader callout: 3D SNAP GRID */}
        {(() => {
          const [px, py] = iso(GRID - 6, 0, 3);
          return (
            <g>
              <circle cx={px} cy={py} r="3" fill="var(--cyan)" />
              <polyline points={`${px},${py} ${px + 28},${py - 30} ${px + 104},${py - 30}`} fill="none" stroke="var(--cyan)" strokeWidth="1" />
              <text x={px + 32} y={py - 35} className="font-mono" fontSize="10" letterSpacing="1.5" fill="var(--ink)">3D SNAP GRID</text>
            </g>
          );
        })()}

        {/* leader callout: active brick */}
        {(() => {
          const c = boxes.find((b) => b.active)!;
          const [px, py] = iso(c.x0, c.level * BRICK_H + BRICK_H * 0.5, c.z0 + c.d);
          const lx = 24;
          return (
            <g>
              <circle cx={px} cy={py} r="3" fill="var(--signal-red)" />
              <polyline points={`${px},${py} ${px - 30},${py - 40} ${lx},${py - 40}`} fill="none" stroke="var(--ink)" strokeWidth="0.75" />
              <text x={lx} y={py - 45} className="font-mono" fontSize="10" letterSpacing="1.5" fill="var(--ink)">
                BRICK {c.w}×{c.d}
              </text>
              <text x={lx} y={py - 28} className="font-mono" fontSize="9" letterSpacing="1" fill="var(--ink-soft)">
                {color.name.toUpperCase()}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* controls */}
      <div className="flex items-center justify-between gap-3 border-t border-ink/15 px-4 py-3">
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Preview brick color">
          {swatches.map((s) => {
            const selected = s.id === colorId;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={s.name}
                title={s.name}
                onClick={() => setColorId(s.id)}
                className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 ${
                  selected ? 'border-ink ring-2 ring-cobalt ring-offset-2' : 'border-ink/25'
                }`}
                style={{ backgroundColor: s.hex }}
              />
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setRotated((r) => !r)}
          className="flex items-center gap-1.5 border border-ink/15 px-2.5 py-1.5 font-mono text-[10px] tracking-[0.14em] text-ink-soft transition-colors hover:border-cobalt hover:text-cobalt"
        >
          <RotateCw className="h-3.5 w-3.5" /> ROTATE 90°
        </button>
      </div>
    </div>
  );
}
