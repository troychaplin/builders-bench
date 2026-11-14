/**
 * Core domain types for Builder's Bench.
 *
 * Units:
 * - Horizontal positions (x, z) and footprints are measured in studs.
 * - Vertical position (y) and height are measured in "height units":
 *   1 plate = 1 unit, 1 standard brick = 3 units.
 */

export type BrickCategory = 'brick' | 'plate' | 'tile' | 'slope' | 'special';

export interface BrickPart {
  id: string;
  name: string;
  category: BrickCategory;
  widthStuds: number;
  depthStuds: number;
  heightUnits: number;
}

export type BrickFinish = 'solid' | 'transparent' | 'metallic';

export interface BrickColor {
  id: string;
  name: string;
  hex: string;
  finish: BrickFinish;
}

export type BrickRotation = 0 | 90 | 180 | 270;

export interface PlacedBrick {
  instanceId: string;
  partId: string;
  colorId: string;
  x: number;
  y: number;
  z: number;
  rotation: BrickRotation;
}

export interface BuildProject {
  id: string;
  title: string;
  author: string;
  createdAt: string;
  baseplateSize: number;
  bricks: PlacedBrick[];
}

export interface BlockFigure {
  id: string;
  name: string;
  hatId: string;
  headId: string;
  torsoId: string;
  legsId: string;
  accessoryId: string;
  colors: Record<string, string>;
}
