import type { BrickRotation, BuildProject, PlacedBrick } from '@/types/brick';

export type KitDifficulty = 'beginner' | 'intermediate' | 'master';

export interface StarterKit {
  slug: string;
  difficulty: KitDifficulty;
  tagline: string;
  project: BuildProject;
}

export const DIFFICULTY_LABEL: Record<KitDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  master: 'Master Builder',
};

/** Compact authoring: [partId, colorId, x, y, z, rotation?]. */
type B = [string, string, number, number, number, BrickRotation?];

function kit(slug: string, title: string, baseplateColor: string, list: B[]): BuildProject {
  return {
    id: `kit-${slug}`,
    title,
    author: "Builder's Bench",
    createdAt: '2026-11-14T00:00:00.000Z',
    baseplateSize: 24,
    baseplateColor,
    bricks: list.map(
      ([partId, colorId, x, y, z, rotation = 0], i): PlacedBrick => ({
        instanceId: `${slug}-${i + 1}`,
        partId,
        colorId,
        x,
        y,
        z,
        rotation,
      }),
    ),
  };
}

/* Heights are in plate units: brick/slope/wheel = 3, plate/tile/round = 1, window = 6. */

const turboRedRacer = kit('turbo-red-racer', 'Turbo Red Racer', 'stone-gray', [
  // Axles
  ['wheel-axle-2x2', 'dark-stone-gray', 11, 0, 8],
  ['wheel-axle-2x2', 'dark-stone-gray', 11, 0, 14],
  // Chassis
  ['plate-2x4', 'obsidian-black', 10, 3, 8],
  ['plate-2x4', 'obsidian-black', 12, 3, 8],
  ['plate-2x4', 'obsidian-black', 10, 3, 12],
  ['plate-2x4', 'obsidian-black', 12, 3, 12],
  // Body
  ['slope-45-2x2', 'bright-red', 10, 4, 8, 180],
  ['slope-45-2x2', 'bright-red', 12, 4, 8, 180],
  ['brick-1x4', 'bright-red', 10, 4, 10],
  ['brick-1x4', 'bright-red', 13, 4, 10],
  ['slope-45-1x2', 'trans-light-blue', 11, 4, 10, 180],
  ['slope-45-1x2', 'trans-light-blue', 12, 4, 10, 180],
  ['brick-2x2', 'pure-white', 11, 4, 12],
  ['brick-2x4', 'bright-red', 10, 4, 14, 90],
]);

const galaxyStarfighter = kit('galaxy-starfighter', 'Galaxy Starfighter', 'deep-space-black', [
  // Display stand
  ['brick-2x2', 'dark-stone-gray', 11, 0, 11],
  ['brick-2x2', 'dark-stone-gray', 11, 3, 11],
  // Hull core
  ['plate-4x4', 'light-stone-gray', 10, 6, 10],
  // Hull plates, wings and cockpit base
  ['plate-2x4', 'light-stone-gray', 11, 7, 7],
  ['plate-2x4', 'light-stone-gray', 11, 7, 13],
  ['plate-2x4', 'pure-white', 7, 7, 11, 90],
  ['plate-2x4', 'pure-white', 13, 7, 11, 90],
  ['brick-2x2', 'light-stone-gray', 11, 7, 11],
  // Nose
  ['slope-45-2x2', 'bright-blue', 11, 8, 7, 180],
  ['tile-2x2', 'obsidian-black', 11, 8, 9],
  // Wing tips and wing ribs
  ['slope-45-2x2', 'bright-blue', 7, 8, 11, 90],
  ['slope-45-2x2', 'bright-blue', 15, 8, 11, 270],
  ['brick-1x2', 'pure-white', 9, 8, 11],
  ['brick-1x2', 'pure-white', 10, 8, 11],
  ['brick-1x2', 'pure-white', 13, 8, 11],
  ['brick-1x2', 'pure-white', 14, 8, 11],
  // Engines
  ['brick-2x2', 'dark-stone-gray', 11, 8, 13],
  ['round-1x1', 'trans-orange', 11, 8, 15],
  ['round-1x1', 'trans-orange', 12, 8, 15],
  ['round-1x1', 'trans-orange', 11, 8, 16],
  ['round-1x1', 'trans-orange', 12, 8, 16],
  // Canopy and tail fins
  ['slope-45-2x2', 'trans-light-blue', 11, 10, 11, 180],
  ['slope-45-1x2', 'bright-red', 11, 11, 13],
  ['slope-45-1x2', 'bright-red', 12, 11, 13],
]);

const pixelBlockMonster = kit('pixel-block-monster', 'Pixel Block Monster', 'desert-tan', [
  // Feet and legs
  ['brick-2x2', 'dark-red', 8, 0, 10],
  ['brick-2x2', 'dark-red', 14, 0, 10],
  ['brick-2x2', 'lime-green', 8, 3, 10],
  ['brick-2x2', 'lime-green', 14, 3, 10],
  // Belly
  ['brick-2x4', 'lime-green', 8, 6, 10, 90],
  ['brick-2x4', 'lime-green', 12, 6, 10, 90],
  // Chest
  ['brick-2x4', 'olive-green', 10, 9, 10, 90],
  ['brick-1x2', 'lime-green', 8, 9, 10],
  ['brick-1x2', 'lime-green', 9, 9, 10],
  ['brick-1x2', 'lime-green', 14, 9, 10],
  ['brick-1x2', 'lime-green', 15, 9, 10],
  // Shoulders and arms
  ['brick-2x6', 'lime-green', 5, 12, 10, 90],
  ['brick-1x2', 'lime-green', 11, 12, 10],
  ['brick-1x2', 'lime-green', 12, 12, 10],
  ['brick-2x6', 'lime-green', 13, 12, 10, 90],
  // Claws
  ['brick-1x1', 'sunset-orange', 5, 15, 10],
  ['brick-1x1', 'sunset-orange', 5, 15, 11],
  ['brick-1x1', 'sunset-orange', 18, 15, 10],
  ['brick-1x1', 'sunset-orange', 18, 15, 11],
  // Head
  ['brick-2x4', 'lime-green', 8, 15, 10, 90],
  ['brick-2x4', 'lime-green', 12, 15, 10, 90],
  // Face, horns and spikes
  ['round-1x1', 'pure-white', 9, 18, 11],
  ['round-1x1', 'pure-white', 14, 18, 11],
  ['tile-1x2', 'obsidian-black', 11, 18, 11, 90],
  ['slope-45-1x2', 'pure-white', 8, 18, 10],
  ['slope-45-1x2', 'pure-white', 15, 18, 10],
  ['brick-1x1', 'sunset-orange', 10, 18, 10],
  ['brick-1x1', 'sunset-orange', 13, 18, 10],
]);

/** Alternating wall courses around a 4×4 footprint at (10..14, 10..14). */
const courseA = (y: number, color: string): B[] => [
  ['brick-1x4', color, 10, y, 10],
  ['brick-1x4', color, 13, y, 10],
  ['brick-1x2', color, 11, y, 10, 90],
  ['brick-1x2', color, 11, y, 13, 90],
];
const courseB = (y: number, color: string): B[] => [
  ['brick-1x4', color, 10, y, 10, 90],
  ['brick-1x4', color, 10, y, 13, 90],
  ['brick-1x2', color, 10, y, 11],
  ['brick-1x2', color, 13, y, 11],
];

const medievalWatchtower = kit('medieval-watchtower', 'Medieval Watchtower', 'forest-green', [
  ...courseA(0, 'dark-stone-gray'),
  ...courseB(3, 'light-stone-gray'),
  // Course with an arrow-slit window on the front face
  ['brick-1x4', 'dark-stone-gray', 10, 6, 10],
  ['brick-1x4', 'dark-stone-gray', 13, 6, 10],
  ['brick-1x2', 'dark-stone-gray', 11, 6, 10, 90],
  ['window-1x2', 'reddish-brown', 11, 6, 13, 90],
  // Course split around the window
  ['brick-1x4', 'light-stone-gray', 10, 9, 10, 90],
  ['brick-1x2', 'light-stone-gray', 10, 9, 11],
  ['brick-1x2', 'light-stone-gray', 13, 9, 11],
  ['brick-1x1', 'light-stone-gray', 10, 9, 13],
  ['brick-1x1', 'light-stone-gray', 13, 9, 13],
  ...courseA(12, 'dark-stone-gray'),
  ...courseB(15, 'light-stone-gray'),
  // Lookout floor
  ['plate-4x4', 'reddish-brown', 10, 18, 10],
  // Battlements
  ['brick-1x1', 'dark-stone-gray', 10, 19, 10],
  ['brick-1x1', 'dark-stone-gray', 13, 19, 10],
  ['brick-1x1', 'dark-stone-gray', 10, 19, 13],
  ['brick-1x1', 'dark-stone-gray', 13, 19, 13],
  ['tile-1x2', 'light-stone-gray', 11, 19, 10, 90],
  ['tile-1x2', 'light-stone-gray', 11, 19, 13, 90],
  ['tile-1x2', 'light-stone-gray', 10, 19, 11],
  ['tile-1x2', 'light-stone-gray', 13, 19, 11],
  // Flagpole
  ['brick-1x1', 'reddish-brown', 11, 19, 11],
  ['round-1x1', 'bright-red', 11, 22, 11],
]);

export const STARTER_KITS: StarterKit[] = [
  { slug: 'turbo-red-racer', difficulty: 'beginner', tagline: 'A low-slung speedster with a glass windshield.', project: turboRedRacer },
  { slug: 'galaxy-starfighter', difficulty: 'intermediate', tagline: 'Swept wings, glowing engines, ready for launch.', project: galaxyStarfighter },
  { slug: 'pixel-block-monster', difficulty: 'intermediate', tagline: 'A chunky, friendly beast with big orange claws.', project: pixelBlockMonster },
  { slug: 'medieval-watchtower', difficulty: 'master', tagline: 'Staggered stone courses topped with battlements.', project: medievalWatchtower },
];

export function getStarterKit(slug: string): StarterKit | undefined {
  return STARTER_KITS.find((k) => k.slug === slug);
}
