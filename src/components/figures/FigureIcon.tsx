import { getColor } from '@/data/brickCatalog';
import type { ColorKey } from '@/data/figureParts';
import type { BlockFigure } from '@/types/brick';
import { figureColor } from '@/lib/figures/figure';

/*
 * Front-view portrait of a figure as pure SVG attributes (no CSS classes), so
 * it can be embedded in the ID card and rasterised to PNG.
 * Figure space: x ∈ [−1, 1] → 50 ± 28px; y (up, 0..5.4) → 132 − y·23px.
 */
const X = (x: number) => 50 + x * 28;
const Y = (y: number) => 132 - y * 23;
const INK = '#1b1f24';

function rect(x: number, y: number, w: number, h: number, fill: string, extra: Record<string, string | number> = {}) {
  // (x, y) is the bottom-centre in figure space.
  return <rect x={X(x - w / 2)} y={Y(y + h)} width={w * 28} height={h * 23} fill={fill} stroke={INK} strokeWidth={1} {...extra} />;
}

export default function FigureIcon({ figure, size = 80 }: { figure: BlockFigure; size?: number }) {
  const c = (k: ColorKey) => getColor(figureColor(figure, k))!.hex;
  const skin = c('head');
  const acc = c('accessory');
  const gear = c('headgear');
  const holds = figure.accessoryId !== 'none' && figure.accessoryId !== 'tower-shield';

  return (
    <svg viewBox="0 0 100 140" width={size} height={(size * 140) / 100} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* staff behind the body */}
      {figure.accessoryId === 'crystal-staff' && (
        <>
          <line x1={X(-1.05)} y1={Y(0.2)} x2={X(-1.05)} y2={Y(4.6)} stroke={acc} strokeWidth={3} />
          <polygon points={`${X(-1.05)},${Y(5.2)} ${X(-0.88)},${Y(4.75)} ${X(-1.05)},${Y(4.3)} ${X(-1.22)},${Y(4.75)}`} fill={acc} stroke={INK} strokeWidth={1} />
        </>
      )}

      {/* boots + legs */}
      {[-0.42, 0.42].map((x) => (
        <g key={x}>
          {rect(x, 0, 0.78, 0.45, c('legs'))}
          {figure.legsId === 'shorts' ? (
            <>
              {rect(x, 0.45, 0.6, 0.6, skin)}
              {rect(x, 1.02, 0.74, 0.48, c('legs'))}
            </>
          ) : (
            rect(x, 0.45, 0.7, 1.05, figure.legsId === 'mech-legs' ? '#a8adb3' : c('legs'))
          )}
          {figure.legsId === 'armored-greaves' && rect(x, 0.55, 0.74, 0.45, '#a8adb3')}
          {figure.legsId === 'cargo-pants' && rect(x + (x < 0 ? -0.36 : 0.36), 0.75, 0.14, 0.38, c('legs'))}
        </g>
      ))}
      {rect(0, 1.5, 1.64, 0.3, c('legs'))}
      {figure.legsId === 'utility-belt-legs' && rect(0, 1.62, 1.7, 0.16, INK)}

      {/* arms */}
      {[-1, 1].map((s) => (
        <g key={s}>
          {rect(0.98 * s, 1.95, 0.46, 1.05, c('arms'), { rx: 5 })}
          {rect(0.98 * s, 1.72, 0.36, 0.26, skin, { rx: 3 })}
        </g>
      ))}

      {/* torso */}
      {rect(0, 1.8, 1.6, 1.3, c('torso'))}
      {figure.torsoId === 'astronaut-suit' && rect(0, 2.3, 0.72, 0.4, '#f8fafc')}
      {figure.torsoId === 'castle-armor' && rect(0, 2.0, 1.3, 1.0, '#a8adb3')}
      {figure.torsoId === 'hero-emblem' && (
        <polygon points={`${X(0)},${Y(2.9)} ${X(0.32)},${Y(2.55)} ${X(0)},${Y(2.2)} ${X(-0.32)},${Y(2.55)}`} fill="#d4a12a" stroke={INK} strokeWidth={1} />
      )}
      {figure.torsoId === 'ninja-tunic' && (
        <line x1={X(-0.6)} y1={Y(1.9)} x2={X(0.6)} y2={Y(3.0)} stroke={c('arms')} strokeWidth={5} />
      )}
      {figure.torsoId === 'street-hoodie' && rect(0, 1.9, 0.9, 0.35, c('arms'))}
      {figure.torsoId === 'lab-coat' && (
        <>
          {rect(-0.45, 1.8, 0.66, 1.3, '#f8fafc')}
          {rect(0.45, 1.8, 0.66, 1.3, '#f8fafc')}
        </>
      )}
      {figure.torsoId === 'explorer-vest' && (
        <>
          {rect(-0.45, 1.85, 0.58, 1.1, '#c2a46b')}
          {rect(0.45, 1.85, 0.58, 1.1, '#c2a46b')}
          {rect(-0.45, 2.05, 0.32, 0.26, '#c2a46b')}
          {rect(0.45, 2.05, 0.32, 0.26, '#c2a46b')}
        </>
      )}
      {figure.torsoId === 'sports-jersey' && (
        <path d={`M ${X(-0.25)} ${Y(2.75)} L ${X(0.25)} ${Y(2.75)} L ${X(0)} ${Y(2.05)}`} stroke="#f8fafc" strokeWidth={3.5} fill="none" />
      )}
      {figure.torsoId === 'chef-jacket' && (
        <>
          {rect(0, 1.85, 1.36, 1.15, '#f8fafc')}
          {[-0.22, 0.22].map((x) => [2.15, 2.45, 2.75].map((y) => <circle key={`${x}${y}`} cx={X(x)} cy={Y(y)} r={1.4} fill={INK} />))}
        </>
      )}
      {figure.torsoId === 'cyber-mech-chest' && <circle cx={X(0)} cy={Y(2.55)} r={6} fill="#22d3ee" stroke={INK} strokeWidth={1} />}

      {/* head */}
      {rect(0, 3.1, 0.56, 0.14, skin)}
      {rect(0, 3.22, 1.04, 1.0, skin, { rx: 4 })}
      <Face id={figure.headId} />

      {/* headgear */}
      <Headgear id={figure.hatId} color={gear} accent={c('torso')} />

      {/* held accessory */}
      {holds && figure.accessoryId !== 'crystal-staff' && <HeldItem id={figure.accessoryId} color={acc} />}
      {figure.accessoryId === 'tower-shield' && rect(1.05, 1.2, 1.0, 1.35, acc, { rx: 3 })}
    </svg>
  );
}

function Face({ id }: { id: string }) {
  const eye = (x: number, w = 3, h = 4) => <rect key={x} x={X(x) - w / 2} y={Y(3.86)} width={w} height={h} fill={INK} />;
  const smile = <path d={`M ${X(-0.2)} ${Y(3.62)} Q ${X(0)} ${Y(3.45)} ${X(0.2)} ${Y(3.62)}`} stroke={INK} strokeWidth={1.6} fill="none" />;
  switch (id) {
    case 'cool-sunglasses':
      return (
        <>
          <rect x={X(-0.4)} y={Y(3.9)} width={22} height={5} fill={INK} />
          {smile}
        </>
      );
    case 'bot-face':
      return (
        <>
          <rect x={X(-0.43)} y={Y(4.1)} width={24} height={20} fill="#a8adb3" stroke={INK} strokeWidth={0.8} />
          <rect x={X(-0.28)} y={Y(3.92)} width={4.5} height={4.5} fill="#22d3ee" />
          <rect x={X(0.12)} y={Y(3.92)} width={4.5} height={4.5} fill="#22d3ee" />
        </>
      );
    case 'pirate-eyepatch':
      return (
        <>
          <circle cx={X(-0.22)} cy={Y(3.8)} r={4} fill={INK} />
          <line x1={X(-0.52)} y1={Y(4.05)} x2={X(0.52)} y2={Y(3.85)} stroke={INK} strokeWidth={1.2} />
          {eye(0.22)}
          <path d={`M ${X(-0.1)} ${Y(3.6)} L ${X(0.2)} ${Y(3.66)}`} stroke={INK} strokeWidth={1.6} />
        </>
      );
    case 'wink':
      return (
        <>
          <circle cx={X(-0.22)} cy={Y(3.8)} r={2} fill={INK} />
          <line x1={X(0.14)} y1={Y(3.8)} x2={X(0.3)} y2={Y(3.82)} stroke={INK} strokeWidth={1.6} />
          {smile}
        </>
      );
    case 'surprised':
      return (
        <>
          <circle cx={X(-0.22)} cy={Y(3.82)} r={2.6} fill={INK} />
          <circle cx={X(0.22)} cy={Y(3.82)} r={2.6} fill={INK} />
          <circle cx={X(0)} cy={Y(3.53)} r={2.4} fill="none" stroke={INK} strokeWidth={1.4} />
        </>
      );
    case 'sleepy':
      return (
        <>
          <path d={`M ${X(-0.32)} ${Y(3.82)} Q ${X(-0.22)} ${Y(3.74)} ${X(-0.12)} ${Y(3.82)} M ${X(0.12)} ${Y(3.82)} Q ${X(0.22)} ${Y(3.74)} ${X(0.32)} ${Y(3.82)}`} stroke={INK} strokeWidth={1.4} fill="none" />
          <line x1={X(-0.08)} y1={Y(3.56)} x2={X(0.08)} y2={Y(3.56)} stroke={INK} strokeWidth={1.6} />
        </>
      );
    case 'freckles':
      return (
        <>
          <circle cx={X(-0.22)} cy={Y(3.8)} r={2} fill={INK} />
          <circle cx={X(0.22)} cy={Y(3.8)} r={2} fill={INK} />
          {[-1, 1].map((s) =>
            [
              [0.3, 3.66],
              [0.38, 3.62],
              [0.32, 3.57],
            ].map(([x, y]) => <circle key={`${s}${x}${y}`} cx={X(x * s)} cy={Y(y)} r={0.8} fill="#9a5b3a" />),
          )}
          {smile}
        </>
      );
    case 'battle-determination':
      return (
        <>
          {eye(-0.22, 5, 2)}
          {eye(0.22, 5, 2)}
          <path d={`M ${X(-0.36)} ${Y(4.02)} L ${X(-0.1)} ${Y(3.92)} M ${X(0.36)} ${Y(4.02)} L ${X(0.1)} ${Y(3.92)}`} stroke={INK} strokeWidth={1.6} />
          <line x1={X(-0.16)} y1={Y(3.58)} x2={X(0.16)} y2={Y(3.58)} stroke={INK} strokeWidth={1.6} />
        </>
      );
    case 'hero-grin':
      return (
        <>
          {eye(-0.22)}
          {eye(0.22)}
          <rect x={X(-0.23)} y={Y(3.65)} width={13} height={4} fill="#f8fafc" stroke={INK} strokeWidth={1} />
        </>
      );
    default:
      return (
        <>
          <circle cx={X(-0.22)} cy={Y(3.8)} r={2} fill={INK} />
          <circle cx={X(0.22)} cy={Y(3.8)} r={2} fill={INK} />
          {smile}
        </>
      );
  }
}

function Headgear({ id, color, accent }: { id: string; color: string; accent: string }) {
  const top = 4.22;
  switch (id) {
    case 'space-helmet':
      return (
        <>
          <circle cx={X(0)} cy={Y(3.72)} r={0.82 * 26} fill="#dbeafe" fillOpacity={0.35} stroke={INK} strokeWidth={1} />
          <rect x={X(-0.6)} y={Y(3.24)} width={34} height={4} fill={color} stroke={INK} strokeWidth={1} />
        </>
      );
    case 'knight-visor':
      return (
        <>
          <rect x={X(-0.6)} y={Y(top + 0.15)} width={34} height={27} fill={color} stroke={INK} strokeWidth={1} />
          <rect x={X(-0.45)} y={Y(3.9)} width={25} height={3} fill={INK} />
          <path d={`M ${X(0)} ${Y(top + 0.15)} L ${X(0.12)} ${Y(top + 0.75)} L ${X(-0.12)} ${Y(top + 0.75)} Z`} fill={accent} stroke={INK} strokeWidth={1} />
        </>
      );
    case 'ninja-hood':
      return (
        <>
          <rect x={X(-0.57)} y={Y(top + 0.1)} width={32} height={9} fill={color} stroke={INK} strokeWidth={1} />
          <rect x={X(-0.57)} y={Y(3.68)} width={32} height={11} fill={color} stroke={INK} strokeWidth={1} />
        </>
      );
    case 'spiky-hair':
      return (
        <path
          d={`M ${X(-0.55)} ${Y(top - 0.05)} L ${X(-0.45)} ${Y(top + 0.6)} L ${X(-0.2)} ${Y(top + 0.2)} L ${X(0)} ${Y(top + 0.75)} L ${X(0.2)} ${Y(top + 0.2)} L ${X(0.45)} ${Y(top + 0.6)} L ${X(0.55)} ${Y(top - 0.05)} Z`}
          fill={color}
          stroke={INK}
          strokeWidth={1}
        />
      );
    case 'wizard-hat':
      return (
        <>
          <rect x={X(-0.88)} y={Y(top + 0.06)} width={49} height={3} fill={color} stroke={INK} strokeWidth={1} />
          <path d={`M ${X(-0.5)} ${Y(top + 0.06)} L ${X(0.15)} ${Y(top + 1.35)} L ${X(0.5)} ${Y(top + 0.06)} Z`} fill={color} stroke={INK} strokeWidth={1} />
          <rect x={X(-0.5)} y={Y(top + 0.26)} width={28} height={4} fill={accent} />
        </>
      );
    case 'royal-crown':
      return (
        <path
          d={`M ${X(-0.5)} ${Y(top)} L ${X(-0.5)} ${Y(top + 0.45)} L ${X(-0.25)} ${Y(top + 0.25)} L ${X(0)} ${Y(top + 0.5)} L ${X(0.25)} ${Y(top + 0.25)} L ${X(0.5)} ${Y(top + 0.45)} L ${X(0.5)} ${Y(top)} Z`}
          fill="#d4a12a"
          stroke={INK}
          strokeWidth={1}
        />
      );
    case 'chef-hat':
      return (
        <>
          {rect(0, top, 0.92, 0.3, color)}
          <ellipse cx={X(0)} cy={Y(top + 0.62)} rx={0.6 * 28} ry={0.36 * 23} fill={color} stroke={INK} strokeWidth={1} />
        </>
      );
    case 'baseball-cap':
      return (
        <>
          <path d={`M ${X(-0.56)} ${Y(top - 0.05)} A ${0.56 * 28} ${0.5 * 23} 0 0 1 ${X(0.56)} ${Y(top - 0.05)} Z`} fill={color} stroke={INK} strokeWidth={1} />
          {rect(0, top - 0.12, 1.16, 0.1, color)}
        </>
      );
    case 'horned-helmet':
      return (
        <>
          <path d={`M ${X(-0.6)} ${Y(top - 0.1)} A ${0.6 * 28} ${0.55 * 23} 0 0 1 ${X(0.6)} ${Y(top - 0.1)} Z`} fill={color} stroke={INK} strokeWidth={1} />
          {[-1, 1].map((s) => (
            <polygon
              key={s}
              points={`${X(0.52 * s)},${Y(top + 0.05)} ${X(1.0 * s)},${Y(top + 0.62)} ${X(0.62 * s)},${Y(top + 0.3)}`}
              fill="#f8fafc"
              stroke={INK}
              strokeWidth={1}
            />
          ))}
        </>
      );
    case 'top-hat':
      return (
        <>
          {rect(0, top, 1.5, 0.08, color)}
          {rect(0, top + 0.08, 0.92, 0.88, color)}
          {rect(0, top + 0.08, 0.92, 0.18, accent)}
        </>
      );
    case 'headphones':
      return (
        <>
          {/* Outline first so a light band still shows against the background. */}
          <path d={`M ${X(-0.62)} ${Y(3.7)} A ${0.62 * 28} ${0.62 * 23} 0 0 1 ${X(0.62)} ${Y(3.7)}`} stroke={INK} strokeWidth={5} fill="none" />
          <path d={`M ${X(-0.62)} ${Y(3.7)} A ${0.62 * 28} ${0.62 * 23} 0 0 1 ${X(0.62)} ${Y(3.7)}`} stroke={color} strokeWidth={3} fill="none" />
          {rect(-0.62, 3.42, 0.22, 0.5, color, { rx: 2 })}
          {rect(0.62, 3.42, 0.22, 0.5, color, { rx: 2 })}
        </>
      );
    case 'cyber-visor':
      return (
        <>
          <rect x={X(-0.57)} y={Y(3.93)} width={32} height={6} fill={color} stroke={INK} strokeWidth={1} />
          <rect x={X(-0.45)} y={Y(3.86)} width={25} height={2.4} fill="#22d3ee" />
        </>
      );
    default:
      return null;
  }
}

function HeldItem({ id, color }: { id: string; color: string }) {
  const hx = X(-0.98);
  const hy = Y(1.85);
  switch (id) {
    case 'laser-blaster':
      return <rect x={hx - 14} y={hy - 4} width={14} height={7} fill={color} stroke={INK} strokeWidth={1} />;
    case 'energy-blade':
      return <rect x={hx - 2} y={hy - 40} width={4} height={36} fill={color} stroke={INK} strokeWidth={0.6} />;
    case 'broadsword':
      return (
        <>
          <rect x={hx - 2.5} y={hy - 38} width={5} height={33} fill={color} stroke={INK} strokeWidth={1} />
          <rect x={hx - 7} y={hy - 6} width={14} height={3} fill="#d4a12a" stroke={INK} strokeWidth={0.8} />
        </>
      );
    case 'wrench':
      return (
        <>
          <rect x={hx - 2} y={hy - 24} width={4} height={22} fill={color} stroke={INK} strokeWidth={1} />
          <circle cx={hx} cy={hy - 27} r={5} fill="none" stroke={color} strokeWidth={3} />
        </>
      );
    case 'magic-wand':
      return (
        <>
          <line x1={hx} y1={hy - 2} x2={hx} y2={hy - 24} stroke={color} strokeWidth={2.5} />
          <polygon
            points={`${hx},${hy - 33} ${hx + 2.5},${hy - 27} ${hx + 7},${hy - 27} ${hx + 3.5},${hy - 23.5} ${hx + 5},${hy - 18} ${hx},${hy - 21.5} ${hx - 5},${hy - 18} ${hx - 3.5},${hy - 23.5} ${hx - 7},${hy - 27} ${hx - 2.5},${hy - 27}`}
            fill="#facc15"
            stroke={INK}
            strokeWidth={0.8}
          />
        </>
      );
    case 'pickaxe':
      return (
        <>
          <rect x={hx - 1.8} y={hy - 30} width={3.6} height={28} fill="#8b5a2b" stroke={INK} strokeWidth={0.8} />
          <path d={`M ${hx - 13} ${hy - 25} Q ${hx} ${hy - 35} ${hx + 13} ${hy - 25} L ${hx + 11} ${hy - 28} Q ${hx} ${hy - 38} ${hx - 11} ${hy - 28} Z`} fill={color} stroke={INK} strokeWidth={1} />
        </>
      );
    case 'torch':
      return (
        <>
          <rect x={hx - 2} y={hy - 20} width={4} height={18} fill="#8b5a2b" stroke={INK} strokeWidth={0.8} />
          <rect x={hx - 4} y={hy - 24} width={8} height={4} fill={color} stroke={INK} strokeWidth={0.8} />
          <path d={`M ${hx - 3.5} ${hy - 24} Q ${hx} ${hy - 38} ${hx + 3.5} ${hy - 24} Z`} fill="#f59e0b" stroke={INK} strokeWidth={0.8} />
        </>
      );
    case 'spyglass':
      return (
        <>
          <rect x={hx - 16} y={hy - 4} width={16} height={6} fill={color} stroke={INK} strokeWidth={1} />
          <rect x={hx - 18} y={hy - 5} width={3} height={8} fill="#d4a12a" stroke={INK} strokeWidth={0.8} />
        </>
      );
    default:
      return null;
  }
}
