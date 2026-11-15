import type { BrickPart } from '@/types/brick';

/** Height of a placed figure in plate units (≈ 4.8 world units, before headgear). */
export const FIGURE_HEIGHT_UNITS = 12;

/**
 * Figures occupy space like a 2×2 part with a smooth top, so the studio's
 * placement, collision and erase rules apply to them unchanged.
 */
export const FIGURE_PART: BrickPart = {
  id: 'figure',
  name: 'Block Figure',
  category: 'special',
  widthStuds: 2,
  depthStuds: 2,
  heightUnits: FIGURE_HEIGHT_UNITS,
};
