'use client';

import dynamic from 'next/dynamic';

/** Reads filters from the URL and the wish list from localStorage, so it renders client-only. */
const SetExplorer = dynamic(() => import('./SetExplorer'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center font-mono text-[11px] tracking-[0.2em] text-ink-soft">
      + OPENING THE ARCHIVE…
    </div>
  ),
});

export default function SetExplorerClient() {
  return <SetExplorer />;
}
