export type ModeStatus = 'active' | 'upcoming';
export type ModeKey = 'studio' | 'kits' | 'figure-lab' | 'sets';

export interface AppMode {
  key: ModeKey;
  href: string;
  /** Module number shown in nav and on cards (1-based). */
  index: number;
  navLabel: string;
  title: string;
  tagline: string;
  description: string;
  status: ModeStatus;
  phase: number;
}

export const APP_MODES: AppMode[] = [
  {
    key: 'studio',
    href: '/studio',
    index: 1,
    navLabel: 'Studio',
    title: 'BuildBin Studio',
    tagline: 'Free-build in 3D',
    description: 'Snap bricks onto a stud grid, orbit your model in 3D, and share it with a single link.',
    status: 'active',
    phase: 1,
  },
  {
    key: 'kits',
    href: '/kits',
    index: 2,
    navLabel: 'Kits',
    title: 'Guided Kits',
    tagline: 'Step-by-step builds',
    description: 'Follow numbered instruction steps with parts call-outs, just like a printed manual.',
    status: 'upcoming',
    phase: 2,
  },
  {
    key: 'figure-lab',
    href: '/figure-lab',
    index: 3,
    navLabel: 'Figure Lab',
    title: 'Figure Lab',
    tagline: 'Design a block figure',
    description: 'Mix hats, heads, torsos, legs, and accessories into your own posable character.',
    status: 'upcoming',
    phase: 3,
  },
  {
    key: 'sets',
    href: '/sets',
    index: 4,
    navLabel: 'Set Explorer',
    title: 'Set Explorer',
    tagline: 'Browse the encyclopedia',
    description: 'Search and filter a catalog of sets by theme, era, and piece count.',
    status: 'upcoming',
    phase: 4,
  },
];

export function getMode(href: string): AppMode {
  const mode = APP_MODES.find((m) => m.href === href);
  if (!mode) throw new Error(`Unknown mode: ${href}`);
  return mode;
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
