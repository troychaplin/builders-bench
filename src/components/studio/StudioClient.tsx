'use client';

import dynamic from 'next/dynamic';

/** The studio reads the URL hash and localStorage on boot, so it renders client-only. */
const StudioApp = dynamic(() => import('./StudioApp'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center font-mono text-[11px] tracking-[0.2em] text-ink-soft">
      + LOADING WORKBENCH…
    </div>
  ),
});

export default function StudioClient() {
  return <StudioApp />;
}
