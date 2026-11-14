import type { Metadata } from 'next';
import ModePlaceholder from '@/components/ModePlaceholder';
import { getMode } from '@/data/modes';

const mode = getMode('/kits');

export const metadata: Metadata = { title: mode.title };

export default function KitsPage() {
  return <ModePlaceholder mode={mode} />;
}
