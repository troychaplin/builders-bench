import type { Metadata } from 'next';
import ModePlaceholder from '@/components/ModePlaceholder';
import { getMode } from '@/data/modes';

const mode = getMode('/figure-lab');

export const metadata: Metadata = { title: mode.title };

export default function FigureLabPage() {
  return <ModePlaceholder mode={mode} />;
}
