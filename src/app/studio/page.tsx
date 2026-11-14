import type { Metadata } from 'next';
import StudioClient from '@/components/studio/StudioClient';

export const metadata: Metadata = {
  title: 'BuildBin Studio',
  description: 'Free-build with bricks in 3D and share your model with a link.',
};

export default function StudioPage() {
  return <StudioClient />;
}
