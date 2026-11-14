/** The Master Builder Badge: a gold 2×2 brick medallion. */
export default function MasterBadge({ className = 'h-24 w-24', muted = false }: { className?: string; muted?: boolean }) {
  const gold = muted ? '#cbd5e1' : '#F59E0B';
  const goldDark = muted ? '#94a3b8' : '#B45309';
  const ribbon = muted ? '#e2e8f0' : '#2563EB';
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
      <path d="M30 58 L22 92 L36 84 L44 94 L48 62 Z" fill={ribbon} opacity={muted ? 1 : 0.9} />
      <path d="M66 58 L74 92 L60 84 L52 94 L48 62 Z" fill={ribbon} opacity={muted ? 1 : 0.75} />
      <circle cx="48" cy="40" r="32" fill={gold} stroke="#0F172A" strokeWidth="2" />
      <circle cx="48" cy="40" r="25" fill="none" stroke={goldDark} strokeWidth="1.5" strokeDasharray="2 3" />
      <rect x="31" y="34" width="34" height="18" rx="2" fill="#fff" fillOpacity={muted ? 0.5 : 0.92} stroke="#0F172A" strokeWidth="1.5" />
      {[38, 58].map((cx) => (
        <g key={cx}>
          <rect x={cx - 5} y="27" width="10" height="8" rx="1.5" fill="#fff" fillOpacity={muted ? 0.5 : 0.92} stroke="#0F172A" strokeWidth="1.5" />
        </g>
      ))}
      <path d="M41 43 l5 5 l9 -10" fill="none" stroke={muted ? '#94a3b8' : '#10B981'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
