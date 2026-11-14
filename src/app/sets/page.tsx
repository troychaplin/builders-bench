import type { Metadata } from 'next';
import ModePlaceholder from '@/components/ModePlaceholder';
import { getMode } from '@/data/modes';

const mode = getMode('/sets');

export const metadata: Metadata = { title: mode.title };

export default function SetsPage() {
  return <ModePlaceholder mode={mode} />;
}
