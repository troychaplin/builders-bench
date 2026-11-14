'use client';

import dynamic from 'next/dynamic';
import { DIFFICULTY_LABEL, getStarterKit } from '@/data/starterKits';

export const Loading = () => (
  <div className="flex h-[calc(100dvh-4rem)] items-center justify-center font-mono text-[11px] tracking-[0.2em] text-ink-soft">
    + LOADING INSTRUCTIONS…
  </div>
);

const KitPlayer = dynamic(() => import('./KitPlayer'), { ssr: false, loading: Loading });

/** Plays one of the built-in starter kits. */
export function StarterKitClient({ slug }: { slug: string }) {
  const kit = getStarterKit(slug);
  if (!kit) return null;
  return <KitPlayer project={kit.project} kitId={kit.slug} label={DIFFICULTY_LABEL[kit.difficulty]} />;
}

const CustomKit = dynamic(() => import('./CustomKit'), { ssr: false, loading: Loading });

/** Plays any build passed in the URL hash (from the studio or an uploaded cartridge). */
export function CustomKitClient() {
  return <CustomKit />;
}
