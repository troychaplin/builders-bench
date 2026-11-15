import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { BrickColor, BrickPart } from '@/types/brick';
import { GAP, STUD_HEIGHT, STUD_RADIUS, UNIT_H } from './constants';
import { fillsCell, hasStuds } from './footprint';

/**
 * Geometry for one part, in local space: centred on X/Z, bottom at y = 0,
 * width along X and depth along Z (back = −Z). Merged so each brick is a
 * single draw call (plus optional glass/rubber sub-meshes).
 */
export interface PartGeometry {
  body: THREE.BufferGeometry;
  glass?: THREE.BufferGeometry;
  rubber?: THREE.BufferGeometry;
}

const geometryCache = new Map<string, PartGeometry>();

function prep(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const out = g.index ? g.toNonIndexed() : g;
  out.clearGroups();
  return out;
}

function box(w: number, h: number, d: number, x: number, y: number, z: number) {
  return prep(new THREE.BoxGeometry(w, h, d).translate(x, y, z));
}

function cylinderX(r: number, len: number, x: number, y: number, segments = 24) {
  return prep(new THREE.CylinderGeometry(r, r, len, segments).rotateZ(Math.PI / 2).translate(x, y, 0));
}

function studs(part: BrickPart, top: number) {
  const out: THREE.BufferGeometry[] = [];
  if (!hasStuds(part)) return out;
  for (let i = 0; i < part.widthStuds; i++) {
    for (let j = 0; j < part.depthStuds; j++) {
      if (!fillsCell(part, i, j)) continue;
      const x = -part.widthStuds / 2 + i + 0.5;
      const z = -part.depthStuds / 2 + j + 0.5;
      out.push(
        prep(new THREE.CylinderGeometry(STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 20).translate(x, top + STUD_HEIGHT / 2, z)),
      );
    }
  }
  return out;
}

function slopeBody(w: number, d: number, h: number) {
  // Profile drawn in (−z, y) and extruded along +X, so after rotateY(π/2) the
  // profile's first axis maps to world +z. A flat back row, then a 45° face.
  const back = -d / 2 + GAP / 2;
  const front = d / 2 - GAP / 2;
  const lip = UNIT_H * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-back, 0);
  shape.lineTo(-back, h);
  shape.lineTo(-(back + 1 - GAP / 2), h);
  shape.lineTo(-front, lip);
  shape.lineTo(-front, 0);
  shape.closePath();
  const ext = new THREE.ExtrudeGeometry(shape, { depth: w - GAP, bevelEnabled: false });
  ext.rotateY(Math.PI / 2).translate(-(w - GAP) / 2, 0, 0);
  return prep(ext);
}

/**
 * Extrude a side profile drawn in (z, y) across the part's width (X).
 * Points are in local z (back = −d/2) and y (bottom = 0).
 */
function profileBody(points: [number, number][], w: number) {
  const shape = new THREE.Shape();
  // Same mapping as slopeBody: the profile's first axis is −z before rotation.
  points.forEach(([z, y], i) => (i === 0 ? shape.moveTo(-z, y) : shape.lineTo(-z, y)));
  shape.closePath();
  const ext = new THREE.ExtrudeGeometry(shape, { depth: w - GAP, bevelEnabled: false, curveSegments: 1 });
  ext.rotateY(Math.PI / 2).translate(-(w - GAP) / 2, 0, 0);
  return prep(ext);
}

/** Inverted slope: flat studded top, a short front lip, and a 45° underside down to the back row. */
function invertedSlopeBody(w: number, d: number, h: number) {
  const back = -d / 2 + GAP / 2;
  const front = d / 2 - GAP / 2;
  const lip = UNIT_H * 0.5;
  return profileBody(
    [
      [back, 0],
      [back, h],
      [front, h],
      [front, h - lip],
      [back + 1 - GAP / 2, 0],
    ],
    w,
  );
}

/** Arch: solid legs at each end and a one-plate beam over a rounded opening. */
function archBody(w: number, d: number, h: number) {
  const back = -d / 2 + GAP / 2;
  const front = d / 2 - GAP / 2;
  const half = d / 2 - 1; // half the opening, between the legs' inner faces
  const crown = h - UNIT_H;
  const spring = Math.min(crown * 0.35, crown - 0.2);
  const rise = crown - spring;
  const pts: [number, number][] = [
    [back, 0],
    [back, h],
    [front, h],
    [front, 0],
    [half, 0],
    [half, spring],
  ];
  const steps = 16;
  for (let k = 1; k < steps; k++) {
    const t = (k / steps) * Math.PI;
    pts.push([half * Math.cos(t), spring + rise * Math.sin(t)]);
  }
  pts.push([-half, spring], [-half, 0]);
  return profileBody(pts, w);
}

/** One box per filled cell, joined without seams where neighbours are filled. */
function cellBoxes(part: BrickPart, h: number) {
  const out: THREE.BufferGeometry[] = [];
  const W = part.widthStuds;
  const D = part.depthStuds;
  const filled = (i: number, j: number) => i >= 0 && j >= 0 && i < W && j < D && fillsCell(part, i, j);
  for (let i = 0; i < W; i++) {
    for (let j = 0; j < D; j++) {
      if (!filled(i, j)) continue;
      const x0 = -W / 2 + i + (filled(i - 1, j) ? 0 : GAP / 2);
      const x1 = -W / 2 + i + 1 - (filled(i + 1, j) ? 0 : GAP / 2);
      const z0 = -D / 2 + j + (filled(i, j - 1) ? 0 : GAP / 2);
      const z1 = -D / 2 + j + 1 - (filled(i, j + 1) ? 0 : GAP / 2);
      out.push(box(x1 - x0, h, z1 - z0, (x0 + x1) / 2, h / 2, (z0 + z1) / 2));
    }
  }
  return out;
}

function buildShapedGeometry(part: BrickPart, w: number, d: number, h: number): PartGeometry {
  const merge = (parts: THREE.BufferGeometry[]) => mergeGeometries(parts, false)!;
  switch (part.shape) {
    case 'inverted-slope':
      return { body: merge([invertedSlopeBody(w, d, h), ...studs(part, h)]) };
    case 'arch':
      return { body: merge([archBody(w, d, h), ...studs(part, h)]) };
    case 'corner':
      return { body: merge([...cellBoxes(part, h), ...studs(part, h)]) };
    case 'cone':
      return {
        body: merge([prep(new THREE.CylinderGeometry(STUD_RADIUS + 0.03, 0.48, h, 28).translate(0, h / 2, 0)), ...studs(part, h)]),
      };
    case 'round':
    default: {
      const r = Math.min(w, d) / 2 - GAP;
      return { body: merge([prep(new THREE.CylinderGeometry(r, r, h, 32).translate(0, h / 2, 0)), ...studs(part, h)]) };
    }
  }
}

function buildPartGeometry(part: BrickPart): PartGeometry {
  const w = part.widthStuds;
  const d = part.depthStuds;
  const h = part.heightUnits * UNIT_H;
  const merge = (parts: THREE.BufferGeometry[]) => mergeGeometries(parts, false)!;

  if (part.shape) return buildShapedGeometry(part, w, d, h);

  switch (part.category) {
    case 'brick':
    case 'plate':
    case 'tile':
    case 'round':
    case 'arch':
      return { body: merge([box(w - GAP, h, d - GAP, 0, h / 2, 0), ...studs(part, h)]) };

    case 'slope':
      return { body: merge([slopeBody(w, d, h), ...studs(part, h)]) };

    case 'special':
      if (part.id.startsWith('window')) {
        const sill = UNIT_H;
        const post = 0.2;
        const inner = h - sill * 2;
        const zPost = d / 2 - GAP / 2 - post / 2;
        return {
          body: merge([
            box(w - GAP, sill, d - GAP, 0, sill / 2, 0),
            box(w - GAP, sill, d - GAP, 0, h - sill / 2, 0),
            box(w - GAP, inner, post, 0, h / 2, zPost),
            box(w - GAP, inner, post, 0, h / 2, -zPost),
            ...studs(part, h),
          ]),
          glass: box(0.08, inner, d - GAP - post * 2, 0, h / 2, 0),
        };
      }
      if (part.id.startsWith('wheel')) {
        const plateTop = h;
        const plateY = plateTop - UNIT_H / 2;
        const axleY = 0.6;
        return {
          body: merge([
            box(w - GAP, UNIT_H, d - GAP, 0, plateY, 0),
            box(0.5, plateTop - UNIT_H - axleY + 0.1, 0.5, 0, (plateTop - UNIT_H + axleY) / 2, 0),
            cylinderX(0.12, w - 0.1, 0, axleY),
            cylinderX(0.3, 0.44, -0.76, axleY),
            cylinderX(0.3, 0.44, 0.76, axleY),
            ...studs(part, plateTop),
          ]),
          rubber: merge([cylinderX(0.6, 0.4, -0.76, axleY, 32), cylinderX(0.6, 0.4, 0.76, axleY, 32)]),
        };
      }
      return { body: merge([box(w - GAP, h, d - GAP, 0, h / 2, 0), ...studs(part, h)]) };
  }
}

export function getPartGeometry(part: BrickPart): PartGeometry {
  let g = geometryCache.get(part.id);
  if (!g) {
    g = buildPartGeometry(part);
    geometryCache.set(part.id, g);
  }
  return g;
}

/* ---------- materials ---------- */

const materialCache = new Map<string, THREE.Material>();

function cached<T extends THREE.Material>(key: string, make: () => T): T {
  let m = materialCache.get(key) as T | undefined;
  if (!m) {
    m = make();
    materialCache.set(key, m);
  }
  return m;
}

export function brickMaterial(color: BrickColor): THREE.Material {
  return cached(`brick:${color.id}`, () => {
    switch (color.finish) {
      case 'transparent':
        return new THREE.MeshStandardMaterial({
          color: color.hex,
          transparent: true,
          opacity: 0.72,
          depthWrite: false,
          roughness: 0.08,
        });
      case 'metallic':
        return new THREE.MeshStandardMaterial({ color: color.hex, metalness: 0.7, roughness: 0.25 });
      default:
        return new THREE.MeshStandardMaterial({ color: color.hex, roughness: 0.36, metalness: 0 });
    }
  });
}

export const glassMaterial = () =>
  cached('glass', () => new THREE.MeshStandardMaterial({ color: '#dbeafe', transparent: true, opacity: 0.35, depthWrite: false, roughness: 0.05 }));

export const rubberMaterial = () =>
  cached('rubber', () => new THREE.MeshStandardMaterial({ color: '#1f2328', roughness: 0.9 }));

export function ghostMaterial(hex: string, valid: boolean): THREE.Material {
  const color = valid ? hex : '#ef4444';
  return cached(`ghost:${color}`, () =>
    new THREE.MeshStandardMaterial({ color, transparent: true, opacity: valid ? 0.55 : 0.45, depthWrite: false, roughness: 0.4 }),
  );
}
