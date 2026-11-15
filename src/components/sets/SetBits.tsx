'use client';

import Image from 'next/image';
import { Blocks } from 'lucide-react';
import type { BrickSet } from '@/types/set';

/** Size tier used for the comparison "scale" readout. */
export function scaleTier(pieces: number): { label: string; color: string } {
  if (pieces < 200) return { label: 'Micro', color: '#10B981' };
  if (pieces < 1000) return { label: 'Small', color: '#06B6D4' };
  if (pieces < 3000) return { label: 'Medium', color: '#2563EB' };
  if (pieces < 5000) return { label: 'Large', color: '#F59E0B' };
  return { label: 'Massive', color: '#EF4444' };
}

export function SetImage({ set, sizes, priority }: { set: BrickSet; sizes: string; priority?: boolean }) {
  if (!set.imageUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50 text-ink-faint">
        <Blocks className="h-10 w-10" />
      </div>
    );
  }
  return (
    <Image
      src={set.imageUrl}
      alt={`${set.name} (${set.setNum})`}
      fill
      sizes={sizes}
      priority={priority}
      className="object-contain p-3"
    />
  );
}

export function ThemeBadge({ set }: { set: BrickSet }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 truncate border border-cobalt/25 bg-cobalt/5 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-[0.12em] text-cobalt">
      {set.theme.toUpperCase()}
    </span>
  );
}

export const fmt = (n: number) => n.toLocaleString('en-US');
