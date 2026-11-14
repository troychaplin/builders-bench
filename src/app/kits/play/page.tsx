import type { Metadata } from 'next';
import { CustomKitClient } from '@/components/kits/KitClients';

export const metadata: Metadata = {
  title: 'Custom Guided Kit',
  description: 'Your own creation, played back as step-by-step instructions.',
};

export default function CustomKitPage() {
  return <CustomKitClient />;
}
