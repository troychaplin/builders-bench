import type { BrickCategory, BrickColor, BrickPart } from '@/types/brick';

/** Height of one plate in height units. A standard brick is 3 plates tall. */
export const PLATE_HEIGHT = 1;
export const BRICK_HEIGHT = 3;

export const BRICK_COLORS: BrickColor[] = [
  // Solids — primaries & neutrals
  { id: 'bright-red', name: 'Bright Red', hex: '#C91A09', finish: 'solid' },
  { id: 'bright-blue', name: 'Bright Blue', hex: '#0055BF', finish: 'solid' },
  { id: 'bright-yellow', name: 'Bright Yellow', hex: '#F2CD37', finish: 'solid' },
  { id: 'forest-green', name: 'Forest Green', hex: '#237841', finish: 'solid' },
  { id: 'pure-white', name: 'Pure White', hex: '#F4F4F4', finish: 'solid' },
  { id: 'obsidian-black', name: 'Obsidian Black', hex: '#1B2A34', finish: 'solid' },
  { id: 'light-stone-gray', name: 'Light Stone Gray', hex: '#A0A5A9', finish: 'solid' },
  { id: 'dark-stone-gray', name: 'Dark Stone Gray', hex: '#6C6E68', finish: 'solid' },
  // Solids — accents
  { id: 'sunset-orange', name: 'Sunset Orange', hex: '#FE8A18', finish: 'solid' },
  { id: 'lime-green', name: 'Lime Green', hex: '#BBE90B', finish: 'solid' },
  { id: 'sand-tan', name: 'Sand Tan', hex: '#E4CD9E', finish: 'solid' },
  { id: 'reddish-brown', name: 'Reddish Brown', hex: '#582A12', finish: 'solid' },
  { id: 'dark-red', name: 'Dark Red', hex: '#720E0F', finish: 'solid' },
  { id: 'medium-azure', name: 'Medium Azure', hex: '#36AEBF', finish: 'solid' },
  { id: 'dark-navy', name: 'Dark Navy', hex: '#0A3463', finish: 'solid' },
  { id: 'bright-pink', name: 'Bright Pink', hex: '#E4ADC8', finish: 'solid' },
  { id: 'magenta', name: 'Magenta', hex: '#923978', finish: 'solid' },
  { id: 'medium-lavender', name: 'Medium Lavender', hex: '#AC78BA', finish: 'solid' },
  { id: 'olive-green', name: 'Olive Green', hex: '#9B9A5A', finish: 'solid' },
  // Transparents
  { id: 'trans-clear', name: 'Trans-Clear', hex: '#FCFCFC', finish: 'transparent' },
  { id: 'trans-light-blue', name: 'Trans-Light Blue', hex: '#AEEFEC', finish: 'transparent' },
  { id: 'trans-neon-green', name: 'Trans-Neon Green', hex: '#F8F184', finish: 'transparent' },
  { id: 'trans-red', name: 'Trans-Red', hex: '#C91A09', finish: 'transparent' },
  { id: 'trans-orange', name: 'Trans-Orange', hex: '#F08F1C', finish: 'transparent' },
  // Metallics
  { id: 'pearl-gold', name: 'Pearl Gold', hex: '#AA7F2E', finish: 'metallic' },
  { id: 'flat-silver', name: 'Flat Silver', hex: '#898788', finish: 'metallic' },
  { id: 'chrome-black', name: 'Chrome Black', hex: '#2B2B2B', finish: 'metallic' },
];

export const BRICK_PARTS: BrickPart[] = [
  // Bricks
  { id: 'brick-1x1', name: 'Brick 1×1', category: 'brick', widthStuds: 1, depthStuds: 1, heightUnits: BRICK_HEIGHT },
  { id: 'brick-1x2', name: 'Brick 1×2', category: 'brick', widthStuds: 1, depthStuds: 2, heightUnits: BRICK_HEIGHT },
  { id: 'brick-1x3', name: 'Brick 1×3', category: 'brick', widthStuds: 1, depthStuds: 3, heightUnits: BRICK_HEIGHT },
  { id: 'brick-1x4', name: 'Brick 1×4', category: 'brick', widthStuds: 1, depthStuds: 4, heightUnits: BRICK_HEIGHT },
  { id: 'brick-2x2', name: 'Brick 2×2', category: 'brick', widthStuds: 2, depthStuds: 2, heightUnits: BRICK_HEIGHT },
  { id: 'brick-2x4', name: 'Brick 2×4', category: 'brick', widthStuds: 2, depthStuds: 4, heightUnits: BRICK_HEIGHT },
  { id: 'brick-2x6', name: 'Brick 2×6', category: 'brick', widthStuds: 2, depthStuds: 6, heightUnits: BRICK_HEIGHT },
  // Plates
  { id: 'plate-1x2', name: 'Plate 1×2', category: 'plate', widthStuds: 1, depthStuds: 2, heightUnits: PLATE_HEIGHT },
  { id: 'plate-2x2', name: 'Plate 2×2', category: 'plate', widthStuds: 2, depthStuds: 2, heightUnits: PLATE_HEIGHT },
  { id: 'plate-2x4', name: 'Plate 2×4', category: 'plate', widthStuds: 2, depthStuds: 4, heightUnits: PLATE_HEIGHT },
  { id: 'plate-4x4', name: 'Plate 4×4', category: 'plate', widthStuds: 4, depthStuds: 4, heightUnits: PLATE_HEIGHT },
  // Tiles (smooth top, no studs)
  { id: 'tile-1x2', name: 'Tile 1×2', category: 'tile', widthStuds: 1, depthStuds: 2, heightUnits: PLATE_HEIGHT },
  { id: 'tile-2x2', name: 'Tile 2×2', category: 'tile', widthStuds: 2, depthStuds: 2, heightUnits: PLATE_HEIGHT },
  // Slopes
  { id: 'slope-45-1x2', name: 'Slope 45° 1×2', category: 'slope', widthStuds: 1, depthStuds: 2, heightUnits: BRICK_HEIGHT },
  { id: 'slope-45-2x2', name: 'Slope 45° 2×2', category: 'slope', widthStuds: 2, depthStuds: 2, heightUnits: BRICK_HEIGHT },
  // Specials
  { id: 'round-1x1', name: 'Round Stud 1×1', category: 'round', shape: 'round', widthStuds: 1, depthStuds: 1, heightUnits: PLATE_HEIGHT },
  { id: 'window-1x2', name: 'Window 1×2', category: 'special', widthStuds: 1, depthStuds: 2, heightUnits: BRICK_HEIGHT * 2 },
  { id: 'wheel-axle-2x2', name: 'Wheel & Axle 2×2', category: 'special', widthStuds: 2, depthStuds: 2, heightUnits: BRICK_HEIGHT },

  // ---- Append only below this line: share links store each part's index in this list. ----

  // More sizes
  { id: 'brick-1x6', name: 'Brick 1×6', category: 'brick', widthStuds: 1, depthStuds: 6, heightUnits: BRICK_HEIGHT },
  { id: 'brick-1x8', name: 'Brick 1×8', category: 'brick', widthStuds: 1, depthStuds: 8, heightUnits: BRICK_HEIGHT },
  { id: 'brick-2x3', name: 'Brick 2×3', category: 'brick', widthStuds: 2, depthStuds: 3, heightUnits: BRICK_HEIGHT },
  { id: 'brick-2x8', name: 'Brick 2×8', category: 'brick', widthStuds: 2, depthStuds: 8, heightUnits: BRICK_HEIGHT },
  { id: 'plate-1x1', name: 'Plate 1×1', category: 'plate', widthStuds: 1, depthStuds: 1, heightUnits: PLATE_HEIGHT },
  { id: 'plate-1x3', name: 'Plate 1×3', category: 'plate', widthStuds: 1, depthStuds: 3, heightUnits: PLATE_HEIGHT },
  { id: 'plate-1x4', name: 'Plate 1×4', category: 'plate', widthStuds: 1, depthStuds: 4, heightUnits: PLATE_HEIGHT },
  { id: 'plate-1x6', name: 'Plate 1×6', category: 'plate', widthStuds: 1, depthStuds: 6, heightUnits: PLATE_HEIGHT },
  { id: 'plate-1x8', name: 'Plate 1×8', category: 'plate', widthStuds: 1, depthStuds: 8, heightUnits: PLATE_HEIGHT },
  { id: 'plate-2x3', name: 'Plate 2×3', category: 'plate', widthStuds: 2, depthStuds: 3, heightUnits: PLATE_HEIGHT },
  { id: 'plate-2x6', name: 'Plate 2×6', category: 'plate', widthStuds: 2, depthStuds: 6, heightUnits: PLATE_HEIGHT },
  { id: 'plate-2x8', name: 'Plate 2×8', category: 'plate', widthStuds: 2, depthStuds: 8, heightUnits: PLATE_HEIGHT },
  { id: 'plate-4x6', name: 'Plate 4×6', category: 'plate', widthStuds: 4, depthStuds: 6, heightUnits: PLATE_HEIGHT },
  { id: 'plate-6x6', name: 'Plate 6×6', category: 'plate', widthStuds: 6, depthStuds: 6, heightUnits: PLATE_HEIGHT },
  { id: 'plate-8x8', name: 'Plate 8×8', category: 'plate', widthStuds: 8, depthStuds: 8, heightUnits: PLATE_HEIGHT },
  { id: 'tile-1x1', name: 'Tile 1×1', category: 'tile', widthStuds: 1, depthStuds: 1, heightUnits: PLATE_HEIGHT },
  { id: 'tile-1x4', name: 'Tile 1×4', category: 'tile', widthStuds: 1, depthStuds: 4, heightUnits: PLATE_HEIGHT },
  { id: 'tile-2x4', name: 'Tile 2×4', category: 'tile', widthStuds: 2, depthStuds: 4, heightUnits: PLATE_HEIGHT },
  { id: 'slope-45-2x4', name: 'Slope 45° 2×4', category: 'slope', widthStuds: 4, depthStuds: 2, heightUnits: BRICK_HEIGHT },

  // New shapes
  { id: 'slope-33-1x3', name: 'Slope 33° 1×3', category: 'slope', widthStuds: 1, depthStuds: 3, heightUnits: BRICK_HEIGHT },
  { id: 'slope-33-2x3', name: 'Slope 33° 2×3', category: 'slope', widthStuds: 2, depthStuds: 3, heightUnits: BRICK_HEIGHT },
  { id: 'slope-inv-45-1x2', name: 'Inverted Slope 45° 1×2', category: 'slope', shape: 'inverted-slope', studs: true, widthStuds: 1, depthStuds: 2, heightUnits: BRICK_HEIGHT },
  { id: 'slope-inv-45-2x2', name: 'Inverted Slope 45° 2×2', category: 'slope', shape: 'inverted-slope', studs: true, widthStuds: 2, depthStuds: 2, heightUnits: BRICK_HEIGHT },
  { id: 'arch-1x4', name: 'Arch 1×4', category: 'arch', shape: 'arch', widthStuds: 1, depthStuds: 4, heightUnits: BRICK_HEIGHT },
  { id: 'arch-1x6', name: 'Arch 1×6', category: 'arch', shape: 'arch', widthStuds: 1, depthStuds: 6, heightUnits: BRICK_HEIGHT },
  { id: 'corner-brick-2x2', name: 'Corner Brick 2×2', category: 'brick', shape: 'corner', missing: [[1, 1]], widthStuds: 2, depthStuds: 2, heightUnits: BRICK_HEIGHT },
  { id: 'corner-plate-2x2', name: 'Corner Plate 2×2', category: 'plate', shape: 'corner', missing: [[1, 1]], widthStuds: 2, depthStuds: 2, heightUnits: PLATE_HEIGHT },
  { id: 'round-brick-1x1', name: 'Round Brick 1×1', category: 'round', shape: 'round', widthStuds: 1, depthStuds: 1, heightUnits: BRICK_HEIGHT },
  { id: 'round-brick-2x2', name: 'Round Brick 2×2', category: 'round', shape: 'round', widthStuds: 2, depthStuds: 2, heightUnits: BRICK_HEIGHT },
  { id: 'cone-1x1', name: 'Cone 1×1', category: 'round', shape: 'cone', widthStuds: 1, depthStuds: 1, heightUnits: BRICK_HEIGHT },
];

export const BRICK_CATEGORIES: { id: BrickCategory; label: string }[] = [
  { id: 'brick', label: 'Bricks' },
  { id: 'plate', label: 'Plates' },
  { id: 'tile', label: 'Tiles' },
  { id: 'slope', label: 'Slopes' },
  { id: 'round', label: 'Round' },
  { id: 'arch', label: 'Arches' },
  { id: 'special', label: 'Specials' },
];

const colorIndex = new Map(BRICK_COLORS.map((c) => [c.id, c]));
const partIndex = new Map(BRICK_PARTS.map((p) => [p.id, p]));

export function getColor(id: string): BrickColor | undefined {
  return colorIndex.get(id);
}

export function getPart(id: string): BrickPart | undefined {
  return partIndex.get(id);
}

export function getPartsByCategory(category: BrickCategory): BrickPart[] {
  return BRICK_PARTS.filter((p) => p.category === category);
}
