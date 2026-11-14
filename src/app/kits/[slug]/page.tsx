import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Loading, StarterKitClient } from '@/components/kits/KitClients';
import { STARTER_KITS, getStarterKit } from '@/data/starterKits';

export function generateStaticParams() {
  return STARTER_KITS.map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({ params }: PageProps<'/kits/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const kit = getStarterKit(slug);
  return kit ? { title: `${kit.project.title} · Guided Kit`, description: kit.tagline } : {};
}

async function KitResolver({ params }: { params: PageProps<'/kits/[slug]'>['params'] }) {
  const { slug } = await params;
  if (!getStarterKit(slug)) notFound();
  return <StarterKitClient slug={slug} />;
}

export default function StarterKitPage({ params }: PageProps<'/kits/[slug]'>) {
  // Params are read inside Suspense so navigation can show the shell instantly.
  return (
    <Suspense fallback={<Loading />}>
      <KitResolver params={params} />
    </Suspense>
  );
}
