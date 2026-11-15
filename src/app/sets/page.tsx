import type { Metadata } from 'next';
import SetExplorerClient from '@/components/sets/SetExplorerClient';

export const metadata: Metadata = {
  title: 'Set Explorer',
  description: 'Search and compare brick sets by theme, year and piece count, and keep a portable dream set wish list.',
};

export default function SetsPage() {
  return <SetExplorerClient />;
}
