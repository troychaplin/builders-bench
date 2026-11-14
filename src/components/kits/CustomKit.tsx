'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CUSTOM_KIT_ID } from '@/lib/kits/badges';
import { readHashProject } from '@/lib/studio/share';
import KitPlayer from './KitPlayer';

/** Client-only: reads the build from the `#build=` hash and plays it as a kit. */
export default function CustomKit() {
  const [project, setProject] = useState(readHashProject);

  useEffect(() => {
    const onHashChange = () => setProject(readHashProject());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (!project || project.bricks.length === 0) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4">
        <div className="max-w-md border border-ink/15 bg-white/90 p-8 text-center">
          <p className="font-mono text-[10px] tracking-[0.2em] text-cobalt">CUSTOM KIT</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">No build to play</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Open a creation in the studio and choose <strong>Play as Guided Kit</strong>, or load a{' '}
            <code>.brick.json</code> cartridge from the kits page.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/studio" className="bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-cobalt">
              Open Studio
            </Link>
            <Link href="/kits" className="border border-ink/20 px-4 py-2 text-sm font-medium hover:border-cobalt hover:text-cobalt">
              Browse kits
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <KitPlayer key={project.id} project={project} kitId={CUSTOM_KIT_ID} label="Custom kit" />;
}
