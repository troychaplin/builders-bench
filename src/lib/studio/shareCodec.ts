/**
 * Compact binary share-link format (v2).
 *
 * Builds are bit-packed and base64url-encoded instead of JSON + lz-string,
 * which makes links roughly 3–4× shorter. Bricks are grouped by part and
 * colour, so each brick costs only its position and rotation.
 *
 * Parts, colours, baseplate colours/sizes, figure parts and factions are stored
 * as indexes into their catalog lists. Those lists are therefore append-only:
 * reordering or removing entries would change what old links decode to.
 *
 * Layout (all fields MSB-first):
 *   version:4 · sizeIdx:3 · plateColorIdx:5
 *   title: flag:1 [string]   (flag 0 = "Untitled Build")
 *   author: flag:1 [string]  (flag 0 = "Anonymous")
 *   groups:varint, each: partIdx:6 · colorIdx:6 · count:varint, then per brick:
 *     rot:2 · x:posBits · z:posBits · y:7
 *   figures:varint, each: name:string · 5 × partIdx:5 · 6 × colorIdx:6 · faction:3 ·
 *     rot:2 · x:posBits · z:posBits · y:7
 *   string = byteLength:varint · bytes (UTF-8)
 *   varint = 4-bit chunks: continue:1 · data:3
 */
import { BRICK_COLORS, BRICK_PARTS } from '@/data/brickCatalog';
import { FACTIONS, SLOTS } from '@/data/figureParts';
import { COLOR_KEYS } from '@/lib/figures/figure';
import type { BrickRotation, BuildProject } from '@/types/brick';
import { BASEPLATE_COLORS, BASEPLATE_SIZES, getBaseplateColor, normalizeBaseplateSize } from './constants';

const VERSION = 2;
const DEFAULT_TITLE = 'Untitled Build';
const DEFAULT_AUTHOR = 'Anonymous';
const Y_BITS = 7; // MAX_HEIGHT_UNITS is 90

/* ---------- bit stream ---------- */

class BitWriter {
  private bytes: number[] = [];
  private bit = 0;

  write(value: number, bits: number) {
    for (let i = bits - 1; i >= 0; i--) {
      if (this.bit === 0) this.bytes.push(0);
      if ((value >>> i) & 1) this.bytes[this.bytes.length - 1] |= 1 << (7 - this.bit);
      this.bit = (this.bit + 1) & 7;
    }
  }

  varint(value: number) {
    do {
      const chunk = value & 7;
      value >>>= 3;
      this.write(value > 0 ? 1 : 0, 1);
      this.write(chunk, 3);
    } while (value > 0);
  }

  string(s: string) {
    const bytes = new TextEncoder().encode(s);
    this.varint(bytes.length);
    for (const b of bytes) this.write(b, 8);
  }

  toBytes(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

class BitReader {
  private pos = 0;
  constructor(private bytes: Uint8Array) {}

  read(bits: number): number {
    let value = 0;
    for (let i = 0; i < bits; i++) {
      const byte = this.bytes[this.pos >> 3];
      if (byte === undefined) throw new Error('Share link is truncated');
      value = (value << 1) | ((byte >> (7 - (this.pos & 7))) & 1);
      this.pos++;
    }
    return value >>> 0;
  }

  varint(): number {
    let value = 0;
    let shift = 0;
    let more = 1;
    while (more) {
      if (shift > 24) throw new Error('Share link varint too long');
      more = this.read(1);
      value |= this.read(3) << shift;
      shift += 3;
    }
    return value >>> 0;
  }

  string(maxBytes: number): string {
    const len = this.varint();
    if (len > maxBytes) throw new Error('Share link string too long');
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = this.read(8);
    return new TextDecoder().decode(bytes);
  }
}

/* ---------- base64url ---------- */

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/* ---------- helpers ---------- */

const partIndex = new Map(BRICK_PARTS.map((p, i) => [p.id, i]));
const colorIndex = new Map(BRICK_COLORS.map((c, i) => [c.id, i]));

/** Bits needed for a coordinate on this baseplate (24 → 5, 64 → 6). */
const posBits = (size: number) => Math.ceil(Math.log2(size));

const FIGURE_PART_LISTS = SLOTS.map((s) => ({ field: s.field, ids: s.parts.map((p) => p.id) }));

/* ---------- encode / decode ---------- */

export function encodeShareV2(p: BuildProject): string {
  const w = new BitWriter();
  const size = normalizeBaseplateSize(p.baseplateSize);
  const bits = posBits(size);

  w.write(VERSION, 4);
  w.write(Math.max(0, (BASEPLATE_SIZES as readonly number[]).indexOf(size)), 3);
  w.write(Math.max(0, BASEPLATE_COLORS.findIndex((c) => c.id === getBaseplateColor(p.baseplateColor).id)), 5);

  for (const [value, fallback] of [
    [p.title, DEFAULT_TITLE],
    [p.author, DEFAULT_AUTHOR],
  ] as const) {
    const custom = !!value && value !== fallback;
    w.write(custom ? 1 : 0, 1);
    if (custom) w.string(value);
  }

  // Group bricks by part + colour so each brick only stores where it is.
  const groups = new Map<string, { part: number; color: number; bricks: typeof p.bricks }>();
  for (const b of p.bricks) {
    const part = partIndex.get(b.partId);
    const color = colorIndex.get(b.colorId);
    if (part === undefined || color === undefined) continue;
    const key = `${part}:${color}`;
    const g = groups.get(key) ?? { part, color, bricks: [] };
    g.bricks.push(b);
    groups.set(key, g);
  }
  w.varint(groups.size);
  for (const g of groups.values()) {
    w.write(g.part, 6);
    w.write(g.color, 6);
    w.varint(g.bricks.length);
    for (const b of g.bricks) {
      w.write(b.rotation / 90, 2);
      w.write(b.x, bits);
      w.write(b.z, bits);
      w.write(b.y, Y_BITS);
    }
  }

  const figures = p.figures ?? [];
  w.varint(figures.length);
  for (const pf of figures) {
    const f = pf.figure;
    w.string(f.name.slice(0, 32));
    for (const list of FIGURE_PART_LISTS) w.write(Math.max(0, list.ids.indexOf(f[list.field])), 5);
    for (const key of COLOR_KEYS) w.write(colorIndex.get(f.colors[key]) ?? 0, 6);
    w.write(Math.max(0, FACTIONS.findIndex((x) => x.id === f.faction)), 3);
    w.write(pf.rotation / 90, 2);
    w.write(pf.x, bits);
    w.write(pf.z, bits);
    w.write(pf.y, Y_BITS);
  }

  return toBase64Url(w.toBytes());
}

/**
 * Decode a v2 link into raw project data. The result still goes through
 * `sanitizeProject`, which validates bounds and ids like any untrusted input.
 */
export function decodeShareV2(encoded: string): unknown {
  const r = new BitReader(fromBase64Url(encoded));
  if (r.read(4) !== VERSION) return null;
  const size = BASEPLATE_SIZES[r.read(3)];
  if (!size) return null;
  const bits = posBits(size);
  const plate = BASEPLATE_COLORS[r.read(5)];

  const title = r.read(1) ? r.string(320) : DEFAULT_TITLE;
  const author = r.read(1) ? r.string(240) : DEFAULT_AUTHOR;

  const bricks: unknown[] = [];
  const groupCount = r.varint();
  for (let g = 0; g < groupCount; g++) {
    const part = BRICK_PARTS[r.read(6)];
    const color = BRICK_COLORS[r.read(6)];
    const count = r.varint();
    if (bricks.length + count > 20000) return null;
    for (let i = 0; i < count; i++) {
      const rotation = (r.read(2) * 90) as BrickRotation;
      const x = r.read(bits);
      const z = r.read(bits);
      const y = r.read(Y_BITS);
      if (part && color) bricks.push({ partId: part.id, colorId: color.id, x, y, z, rotation });
    }
  }

  const figures: unknown[] = [];
  const figureCount = r.varint();
  if (figureCount > 500) return null;
  for (let i = 0; i < figureCount; i++) {
    const name = r.string(128);
    const figure: Record<string, unknown> = { name, colors: {} };
    for (const list of FIGURE_PART_LISTS) figure[list.field] = list.ids[r.read(5)];
    const colors: Record<string, string | undefined> = {};
    for (const key of COLOR_KEYS) colors[key] = BRICK_COLORS[r.read(6)]?.id;
    figure.colors = colors;
    figure.faction = FACTIONS[r.read(3)]?.id;
    const rotation = r.read(2) * 90;
    const x = r.read(bits);
    const z = r.read(bits);
    const y = r.read(Y_BITS);
    figures.push({ figure, x, y, z, rotation });
  }

  return { title, author, baseplateSize: size, baseplateColor: plate?.id, bricks, figures };
}
