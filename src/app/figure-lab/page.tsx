import type { Metadata } from 'next';
import FigureLabClient from '@/components/figures/FigureLabClient';

export const metadata: Metadata = {
  title: 'Figure Lab',
  description: 'Mix and match block figure parts, generate a Builder ID card, and place heroes in your builds.',
};

export default function FigureLabPage() {
  return <FigureLabClient />;
}
