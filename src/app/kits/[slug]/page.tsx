import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StarterKitClient } from '@/components/kits/KitClients';
import { STARTER_KITS, getStarterKit } from '@/data/starterKits';

// Only the built-in kits exist; any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return STARTER_KITS.map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({ params }: PageProps<'/kits/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const kit = getStarterKit(slug);
  return kit ? { title: `${kit.project.title} · Guided Kit`, description: kit.tagline } : {};
}

export default async function StarterKitPage({ params }: PageProps<'/kits/[slug]'>) {
  const { slug } = await params;
  if (!getStarterKit(slug)) notFound();
  return <StarterKitClient slug={slug} />;
}
