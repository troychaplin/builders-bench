'use client';

import { forwardRef } from 'react';
import { ACCESSORIES, EXPRESSIONS, HEADGEAR, LEGS, TORSOS, getFaction, partName } from '@/data/figureParts';
import type { BlockFigure } from '@/types/brick';
import { builderNumber } from '@/lib/figures/figure';
import FigureIcon from './FigureIcon';

const W = 420;
const H = 260;
const MONO = "ui-monospace, 'SFMono-Regular', Menlo, monospace";
const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

/** Barcode stripes derived from the builder number, so each card is unique. */
function stripes(seed: string) {
  const out: { x: number; w: number }[] = [];
  let x = 0;
  for (let i = 0; x < 150; i++) {
    const c = seed.charCodeAt(i % seed.length);
    const w = 1 + (c % 3);
    out.push({ x, w });
    x += w + 1 + ((c >> 2) % 3);
  }
  return out;
}

/**
 * Collectible Builder ID card, drawn entirely in SVG with inline attributes so
 * it can be downloaded as a PNG.
 */
const IdCard = forwardRef<SVGSVGElement, { figure: BlockFigure; issued: string }>(function IdCard({ figure, issued }, ref) {
  const faction = getFaction(figure.faction);
  const number = builderNumber(figure.id);
  const rows: [string, string][] = [
    ['HEADGEAR', partName(HEADGEAR, figure.hatId)],
    ['FACE', partName(EXPRESSIONS, figure.headId)],
    ['TORSO', partName(TORSOS, figure.torsoId)],
    ['LEGS', partName(LEGS, figure.legsId)],
    ['GEAR', partName(ACCESSORIES, figure.accessoryId)],
  ];

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Builder ID card for ${figure.name}`}>
      <defs>
        <pattern id="card-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#94a3b8" strokeOpacity="0.18" strokeWidth="0.6" />
        </pattern>
        <clipPath id="card-clip">
          <rect width={W} height={H} rx="14" />
        </clipPath>
      </defs>
      <g clipPath="url(#card-clip)">
        <rect width={W} height={H} fill="#F8FAFC" />
        <rect width={W} height={H} fill="url(#card-grid)" />
        {/* header band */}
        <rect width={W} height="44" fill="#0F172A" />
        <rect y="44" width={W} height="4" fill={faction.hex} />
        <text x="18" y="28" fill="#F8FAFC" fontFamily={SANS} fontSize="15" fontWeight="700" letterSpacing="1.5">
          BUILDER&apos;S BENCH
        </text>
        <text x={W - 18} y="28" fill="#94a3b8" fontFamily={MONO} fontSize="10" letterSpacing="2" textAnchor="end">
          BUILDER ID // {faction.name.toUpperCase()}
        </text>

        {/* portrait */}
        <rect x="18" y="62" width="120" height="164" rx="8" fill="#FFFFFF" stroke="#0F172A" strokeOpacity="0.2" />
        <rect x="18" y="62" width="120" height="164" rx="8" fill={faction.hex} fillOpacity="0.07" />
        <g transform="translate(23 64)">
          <FigureIcon figure={figure} size={110} />
        </g>

        {/* details */}
        <text x="156" y="76" fill="#475569" fontFamily={MONO} fontSize="9" letterSpacing="2">NAME</text>
        <text x="156" y="100" fill="#0F172A" fontFamily={SANS} fontSize="22" fontWeight="700">
          {figure.name}
        </text>
        <rect x="156" y="110" width={faction.name.length * 8 + 26} height="18" rx="9" fill={faction.hex} />
        <text x="169" y="123" fill="#FFFFFF" fontFamily={MONO} fontSize="10" fontWeight="700" letterSpacing="1.5">
          {faction.name.toUpperCase()}
        </text>

        {rows.map(([k, v], i) => (
          <g key={k} transform={`translate(156 ${148 + i * 15})`}>
            <text fill="#94a3b8" fontFamily={MONO} fontSize="8.5" letterSpacing="1.5">{k}</text>
            <text x="62" fill="#0F172A" fontFamily={SANS} fontSize="11">{v}</text>
          </g>
        ))}

        {/* footer */}
        <text x="156" y="248" fill="#475569" fontFamily={MONO} fontSize="9" letterSpacing="1.5">
          NO. {number} · ISSUED {issued}
        </text>
        <g transform={`translate(${W - 168} 230)`}>
          {stripes(number).map((s, i) => (
            <rect key={i} x={s.x} y="-14" width={s.w} height="16" fill="#0F172A" />
          ))}
        </g>
        <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="14" fill="none" stroke="#0F172A" strokeOpacity="0.25" />
      </g>
    </svg>
  );
});

export default IdCard;

/** Rasterise the card SVG to a PNG blob at 2× for sharing. */
export async function cardToPng(svg: SVGSVGElement): Promise<Blob | null> {
  const xml = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.width = W * 2;
    img.height = H * 2;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Card image failed to load'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = W * 2;
    canvas.height = H * 2;
    canvas.getContext('2d')?.drawImage(img, 0, 0, W * 2, H * 2);
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
