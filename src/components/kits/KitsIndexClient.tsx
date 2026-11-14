'use client';

import dynamic from 'next/dynamic';

/* localStorage-backed widgets render client-only to avoid hydration mismatches. */

export const EarnedMark = dynamic(() => import('./KitsIndexWidgets').then((m) => m.EarnedMark), { ssr: false });

export const BadgeShelf = dynamic(() => import('./KitsIndexWidgets').then((m) => m.BadgeShelf), {
  ssr: false,
  loading: () => <div className="h-32" />,
});

export const CartridgeLauncher = dynamic(() => import('./KitsIndexWidgets').then((m) => m.CartridgeLauncher), {
  ssr: false,
  loading: () => <div className="h-[132px] border-2 border-dashed border-ink/20" />,
});
