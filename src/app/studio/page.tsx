import type { Metadata } from 'next';
import ModePlaceholder from '@/components/ModePlaceholder';
import { getMode } from '@/data/modes';

const mode = getMode('/studio');

export const metadata: Metadata = { title: mode.title };

export default function StudioPage() {
  return <ModePlaceholder mode={mode} />;
}
