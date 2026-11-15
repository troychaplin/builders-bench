/**
 * Core domain types for Builder's Bench.
 *
 * Units:
 * - Horizontal positions (x, z) and footprints are measured in studs.
 * - Vertical position (y) and height are measured in "height units":
 *   1 plate = 1 unit, 1 standard brick = 3 units.
 */

export type BrickCategory = 'brick' | 'plate' | 'tile' | 'slope' | 'round' | 'arch' | 'special';

/** Shapes that need their own geometry or footprint beyond a plain box. */
export type BrickShape = 'inverted-slope' | 'arch' | 'corner' | 'cone' | 'round';

export interface BrickPart {
  id: string;
  name: string;
  category: BrickCategory;
  widthStuds: number;
  depthStuds: number;
  heightUnits: number;
  shape?: BrickShape;
  /** Overrides whether the top has studs (the category decides by default). */
  studs?: boolean;
  /** Local [column, row] cells inside the footprint that the part doesn't fill. */
  missing?: [number, number][];
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
  /** Studio baseplate color id (optional; defaults to Forest Green). */
  baseplateColor?: string;
  /** Block figures standing on the baseplate (optional). */
  figures?: PlacedFigure[];
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
  /** Figure Lab faction id: space | castle | city | heroes (optional). */
  faction?: string;
}

/** A block figure placed in a build; occupies a 2×2 stud footprint. */
export interface PlacedFigure {
  instanceId: string;
  figure: BlockFigure;
  x: number;
  y: number;
  z: number;
  rotation: BrickRotation;
}
