import type { BrickPart } from '@/types/brick';
import { fillsCell, hasStuds } from '@/lib/studio/footprint';

/** Top-down line-art thumbnail of a part. Long side is drawn horizontally. */
export default function PartThumb({
  part,
  className = 'h-10 w-16',
  fill = 'white',
}: {
  part: BrickPart;
  className?: string;
  /** Body fill, e.g. the selected brick colour. */
  fill?: string;
}) {
  const transpose = part.depthStuds > part.widthStuds;
  const cols = transpose ? part.depthStuds : part.widthStuds;
  const rows = transpose ? part.widthStuds : part.depthStuds;
  const cell = 10;
  const W = cols * cell;
  const H = rows * cell;
  const pad = 2;

  const studs = hasStuds(part);

  const isRound = part.shape === 'round' || part.shape === 'cone';
  const isCorner = !!part.missing?.length;
  const isArch = part.shape === 'arch';
  const isInverted = part.shape === 'inverted-slope';
  /** Whether drawn cell (column c, row r) is part of the piece. */
  const filled = (c: number, r: number) =>
    c >= 0 && r >= 0 && c < cols && r < rows && (transpose ? fillsCell(part, r, c) : fillsCell(part, c, r));
  const isWindow = part.id.startsWith('window');
  const isWheel = part.id.startsWith('wheel');

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${W + pad * 2} ${H + pad * 2}`}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      {isRound ? (
        <circle cx={W / 2} cy={H / 2} r={Math.min(W, H) / 2 - 0.5} fill={fill} />
      ) : isCorner ? (
        // Fill each cell, then outline only the edges that face empty space.
        <>
          {Array.from({ length: cols }, (_, c) =>
            Array.from({ length: rows }, (_, r) =>
              filled(c, r) ? <rect key={`f${c}-${r}`} x={c * cell} y={r * cell} width={cell} height={cell} fill={fill} stroke="none" /> : null,
            ),
          )}
          {Array.from({ length: cols }, (_, c) =>
            Array.from({ length: rows }, (_, r) => {
              if (!filled(c, r)) return null;
              const [x0, y0, x1, y1] = [c * cell, r * cell, (c + 1) * cell, (r + 1) * cell];
              return (
                <g key={`e${c}-${r}`}>
                  {!filled(c, r - 1) && <line x1={x0} y1={y0} x2={x1} y2={y0} />}
                  {!filled(c, r + 1) && <line x1={x0} y1={y1} x2={x1} y2={y1} />}
                  {!filled(c - 1, r) && <line x1={x0} y1={y0} x2={x0} y2={y1} />}
                  {!filled(c + 1, r) && <line x1={x1} y1={y0} x2={x1} y2={y1} />}
                </g>
              );
            }),
          )}
        </>
      ) : (
        <rect x={0} y={0} width={W} height={H} rx={1} fill={fill} />
      )}

      {part.shape === 'cone' && <circle cx={W / 2} cy={H / 2} r={cell * 0.34} strokeWidth={0.6} />}

      {/* The opening under an arch, between its legs. */}
      {isArch &&
        (transpose ? (
          <rect x={cell + 1} y={1.5} width={W - cell * 2 - 2} height={H - 3} strokeWidth={0.5} strokeDasharray="1.5 1.5" />
        ) : (
          <rect x={1.5} y={cell + 1} width={W - 3} height={H - cell * 2 - 2} strokeWidth={0.5} strokeDasharray="1.5 1.5" />
        ))}

      {/* Inverted slopes: a heavy line marks the overhanging front edge. */}
      {isInverted &&
        (transpose ? (
          <line x1={W - 0.5} y1={1} x2={W - 0.5} y2={H - 1} strokeWidth={2} />
        ) : (
          <line x1={1} y1={H - 0.5} x2={W - 1} y2={H - 0.5} strokeWidth={2} />
        ))}

      {part.category === 'slope' && !isInverted &&
        // Hatch the sloped face beyond the flat back row.
        Array.from({ length: 4 }, (_, k) => {
          const t = cell + ((k + 1) * ((transpose ? cols : rows) - 1) * cell) / 5;
          return transpose ? (
            <line key={k} x1={t} y1={1} x2={t} y2={H - 1} strokeWidth={0.4} />
          ) : (
            <line key={k} x1={1} y1={t} x2={W - 1} y2={t} strokeWidth={0.4} />
          );
        })}

      {part.category === 'tile' && <rect x={1.5} y={1.5} width={W - 3} height={H - 3} strokeWidth={0.4} />}
      {isWindow && <rect x={cell * 0.4} y={H / 2 - 1} width={W - cell * 0.8} height={2} fill="#bae6fd" strokeWidth={0.5} />}
      {isWheel && (
        <>
          <rect x={0.5} y={1} width={3} height={H - 2} fill="#1f2328" stroke="none" />
          <rect x={W - 3.5} y={1} width={3} height={H - 2} fill="#1f2328" stroke="none" />
        </>
      )}

      {Array.from({ length: cols }, (_, c) =>
        Array.from({ length: rows }, (_, r) => {
          if (!studs || !filled(c, r)) return null;
          return <circle key={`${c}-${r}`} cx={c * cell + cell / 2} cy={r * cell + cell / 2} r={3} />;
        }),
      )}
    </svg>
  );
}
