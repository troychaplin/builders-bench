import type { BrickColor } from '@/types/brick';

/** CSS for a color chip that hints at its finish. */
export function swatchStyle(c: BrickColor): React.CSSProperties {
  return {
    backgroundColor: c.hex,
    backgroundImage:
      c.finish === 'transparent'
        ? 'linear-gradient(135deg, rgba(255,255,255,0.75) 0 28%, transparent 28% 100%)'
        : c.finish === 'metallic'
          ? 'linear-gradient(135deg, rgba(255,255,255,0.6), transparent 55%, rgba(0,0,0,0.25))'
          : undefined,
    opacity: c.finish === 'transparent' ? 0.82 : 1,
  };
}

/** Readable outline color for drawing on top of a brick color. */
export function inkOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  return lum < 110 ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.75)';
}
