'use client';

import dynamic from 'next/dynamic';

/** Figure Lab reads saved heroes from localStorage, so it renders client-only. */
const FigureLab = dynamic(() => import('./FigureLab'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center font-mono text-[11px] tracking-[0.2em] text-ink-soft">
      + OPENING THE LAB…
    </div>
  ),
});

export default function FigureLabClient() {
  return <FigureLab />;
}
