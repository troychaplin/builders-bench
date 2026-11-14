import type { ModeKey } from '@/data/modes';

/** Custom geometric line-art icons for each studio module. */
export default function ModuleIcon({ mode, className = 'h-10 w-10' }: { mode: ModeKey; className?: string }) {
  const common = {
    viewBox: '0 0 40 40',
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
    'aria-hidden': true,
  };

  switch (mode) {
    case 'studio':
      // Isometric 2×2 brick with studs on a grid line
      return (
        <svg {...common}>
          <path d="M20 12 L33 18.5 L20 25 L7 18.5 Z" />
          <path d="M7 18.5 V26 L20 32.5 V25" />
          <path d="M33 18.5 V26 L20 32.5" />
          {[[20, 14.5], [26, 17.5], [14, 17.5], [20, 20.5]].map(([cx, cy]) => (
            <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy - 1.5} rx="2.6" ry="1.3" />
          ))}
          <path d="M3 36 H37" strokeDasharray="2 3" />
        </svg>
      );
    case 'kits':
      // Stepped instruction stack with numbered step marker
      return (
        <svg {...common}>
          <rect x="6" y="26" width="28" height="7" />
          <rect x="10" y="18" width="20" height="8" />
          <rect x="14" y="10" width="12" height="8" />
          <circle cx="32" cy="9" r="4" />
          <path d="M31 7.5 L32.2 7 V11" />
          <path d="M20 4 V8 M18 6 L20 8 L22 6" />
        </svg>
      );
    case 'figure-lab':
      // Block figure silhouette from simple primitives
      return (
        <svg {...common}>
          <rect x="16.5" y="4" width="7" height="3" rx="1" />
          <rect x="14" y="7" width="12" height="9" rx="3" />
          <path d="M12 17 H28 L30 27 H10 Z" />
          <path d="M10 18 L6 26 M30 18 L34 26" />
          <path d="M12 27 H28 V36 H21 V31 H19 V36 H12 Z" />
        </svg>
      );
    case 'sets':
      // Catalog grid with magnifier
      return (
        <svg {...common}>
          <rect x="5" y="5" width="11" height="11" />
          <rect x="19" y="5" width="11" height="11" />
          <rect x="5" y="19" width="11" height="11" />
          <circle cx="26.5" cy="26.5" r="6" />
          <path d="M31 31 L36 36" />
        </svg>
      );
  }
}
