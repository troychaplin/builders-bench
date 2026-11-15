'use client';

import { createContext, memo, useContext, type ReactNode } from 'react';
import * as THREE from 'three';
import { getColor } from '@/data/brickCatalog';
import type { ColorKey } from '@/data/figureParts';
import type { BlockFigure } from '@/types/brick';
import { figureColor } from '@/lib/figures/figure';
import { brickMaterial } from '@/lib/studio/three';

/*
 * Builder's Bench figure: chunky voxel proportions on a 2×2 stud footprint.
 * Local space: feet at y = 0, centred on X/Z, facing +Z. Total height ≈ 4.3
 * units (≈ 11 plates) before headgear.
 */

/* ---------- materials ---------- */

const matCache = new Map<string, THREE.Material>();
function cachedMat(key: string, make: () => THREE.Material) {
  let m = matCache.get(key);
  if (!m) {
    m = make();
    matCache.set(key, m);
  }
  return m;
}
const INK = () => cachedMat('ink', () => new THREE.MeshStandardMaterial({ color: '#1b1f24', roughness: 0.5 }));
const WHITE = () => cachedMat('white', () => new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4 }));
const SILVER = () => cachedMat('silver', () => new THREE.MeshStandardMaterial({ color: '#a8adb3', metalness: 0.75, roughness: 0.3 }));
const GOLD = () => cachedMat('gold', () => new THREE.MeshStandardMaterial({ color: '#d4a12a', metalness: 0.8, roughness: 0.28 }));
const GLASS = () =>
  cachedMat('glass', () => new THREE.MeshStandardMaterial({ color: '#dbeafe', transparent: true, opacity: 0.32, roughness: 0.05, depthWrite: false }));
const glow = (hex: string) =>
  cachedMat(`glow:${hex}`, () => new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 1.4, roughness: 0.3, toneMapped: false }));

/* ---------- render context (ghost previews, picking) ---------- */

interface Ctx {
  override?: THREE.Material;
  ghost: boolean;
}
const FigureCtx = createContext<Ctx>({ ghost: false });
const noRaycast = () => null;

type MatSpec = THREE.Material;

/** A primitive mesh that honours ghost overrides. */
function P({
  geo,
  mat,
  position,
  rotation,
  scale,
}: {
  geo: ReactNode;
  mat: MatSpec;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}) {
  const { override, ghost } = useContext(FigureCtx);
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      material={override ?? mat}
      castShadow={!ghost}
      receiveShadow={!ghost}
      raycast={ghost ? noRaycast : undefined}
    >
      {geo}
    </mesh>
  );
}

const box = (w: number, h: number, d: number) => <boxGeometry args={[w, h, d]} />;
const cyl = (rt: number, rb: number, h: number, seg = 20, open = false) => (
  <cylinderGeometry args={[rt, rb, h, seg, 1, open]} />
);

/* ---------- parts ---------- */

function Legs({ id, mat }: { id: string; mat: MatSpec }) {
  const boots = [-0.42, 0.42].map((x) => (
    <P key={`boot${x}`} geo={box(0.78, 0.45, 1.0)} mat={mat} position={[x, 0.225, 0.05]} />
  ));

  if (id === 'mech-legs') {
    return (
      <>
        {boots}
        {[-0.42, 0.42].map((x) => (
          <group key={x}>
            <P geo={cyl(0.24, 0.3, 0.5)} mat={SILVER()} position={[x, 0.7, 0]} />
            <P geo={<sphereGeometry args={[0.24, 16, 12]} />} mat={INK()} position={[x, 1.0, 0.02]} />
            <P geo={cyl(0.3, 0.26, 0.5)} mat={mat} position={[x, 1.27, 0]} />
            <P geo={box(0.12, 0.6, 0.12)} mat={SILVER()} position={[x + (x < 0 ? -0.3 : 0.3), 0.95, -0.15]} />
          </group>
        ))}
      </>
    );
  }

  return (
    <>
      {boots}
      {[-0.42, 0.42].map((x) => (
        <P key={x} geo={box(0.72, 1.05, 0.78)} mat={mat} position={[x, 0.975, 0]} />
      ))}
      {id === 'armored-greaves' &&
        [-0.42, 0.42].map((x) => (
          <group key={`g${x}`}>
            <P geo={box(0.8, 0.5, 0.12)} mat={SILVER()} position={[x, 0.75, 0.44]} />
            <P geo={box(0.6, 0.22, 0.14)} mat={SILVER()} position={[x, 1.12, 0.45]} />
          </group>
        ))}
      {id === 'utility-belt-legs' && (
        <>
          {[-0.42, 0.42].map((x) => (
            <P key={`p${x}`} geo={box(0.3, 0.32, 0.3)} mat={INK()} position={[x + (x < 0 ? -0.38 : 0.38), 1.15, 0.05]} />
          ))}
          <P geo={box(0.76, 0.2, 0.2)} mat={INK()} position={[0.42, 0.75, 0.42]} />
        </>
      )}
    </>
  );
}

function Hips({ legsId, mat }: { legsId: string; mat: MatSpec }) {
  return (
    <>
      <P geo={box(1.64, 0.3, 0.86)} mat={mat} position={[0, 1.65, 0]} />
      {legsId === 'utility-belt-legs' && (
        <>
          <P geo={box(1.7, 0.16, 0.92)} mat={INK()} position={[0, 1.72, 0]} />
          <P geo={box(0.26, 0.2, 0.06)} mat={GOLD()} position={[0, 1.72, 0.47]} />
        </>
      )}
    </>
  );
}

function Torso({ id, mat, accent }: { id: string; mat: MatSpec; accent: MatSpec }) {
  const front = 0.47;
  return (
    <group>
      <P geo={box(1.6, 1.3, 0.92)} mat={mat} position={[0, 2.45, 0]} />
      {id === 'astronaut-suit' && (
        <>
          <P geo={box(0.72, 0.42, 0.06)} mat={WHITE()} position={[0, 2.5, front]} />
          {[-0.2, 0, 0.2].map((x, i) => (
            <P key={x} geo={box(0.12, 0.12, 0.05)} mat={glow(['#ef4444', '#f59e0b', '#10b981'][i])} position={[x, 2.5, front + 0.04]} />
          ))}
          <P geo={<torusGeometry args={[0.4, 0.08, 10, 28]} />} mat={WHITE()} position={[0, 3.1, 0]} rotation={[Math.PI / 2, 0, 0]} />
        </>
      )}
      {id === 'castle-armor' && (
        <>
          <P geo={box(1.36, 1.0, 0.1)} mat={SILVER()} position={[0, 2.5, front]} />
          <P geo={box(0.12, 0.8, 0.06)} mat={accent} position={[0, 2.5, front + 0.07]} />
          <P geo={box(0.6, 0.12, 0.06)} mat={accent} position={[0, 2.62, front + 0.07]} />
          {[-0.82, 0.82].map((x) => (
            <P key={x} geo={<sphereGeometry args={[0.36, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />} mat={SILVER()} position={[x, 2.95, 0]} />
          ))}
        </>
      )}
      {id === 'hero-emblem' && (
        <>
          <P geo={cyl(0.36, 0.36, 0.06, 6)} mat={GOLD()} position={[0, 2.55, front]} rotation={[Math.PI / 2, 0, 0]} />
          <P geo={cyl(0.22, 0.22, 0.06, 3)} mat={accent} position={[0, 2.55, front + 0.04]} rotation={[Math.PI / 2, 0, Math.PI]} />
          <P geo={box(1.5, 1.5, 0.06)} mat={accent} position={[0, 2.2, -0.5]} rotation={[0.12, 0, 0]} />
        </>
      )}
      {id === 'ninja-tunic' && (
        <>
          <P geo={box(0.22, 1.5, 0.06)} mat={accent} position={[0, 2.45, front]} rotation={[0, 0, 0.62]} />
          <P geo={box(1.64, 0.18, 0.96)} mat={INK()} position={[0, 1.92, 0]} />
        </>
      )}
      {id === 'street-hoodie' && (
        <>
          <P geo={box(0.9, 0.36, 0.08)} mat={accent} position={[0, 2.05, front]} />
          {[-0.18, 0.18].map((x) => (
            <P key={x} geo={box(0.05, 0.4, 0.05)} mat={WHITE()} position={[x, 2.75, front + 0.02]} />
          ))}
          <P geo={<torusGeometry args={[0.46, 0.16, 10, 24]} />} mat={mat} position={[0, 3.12, -0.12]} rotation={[Math.PI / 2.4, 0, 0]} />
        </>
      )}
      {id === 'cyber-mech-chest' && (
        <>
          <P geo={box(1.1, 0.8, 0.08)} mat={SILVER()} position={[0, 2.55, front]} />
          <P geo={cyl(0.2, 0.2, 0.1, 24)} mat={glow('#22d3ee')} position={[0, 2.6, front + 0.06]} rotation={[Math.PI / 2, 0, 0]} />
          {[2.2, 2.32].map((y) => (
            <P key={y} geo={box(0.9, 0.04, 0.04)} mat={INK()} position={[0, y, front + 0.05]} />
          ))}
        </>
      )}
    </group>
  );
}

function Accessory({ id, mat, glowHex }: { id: string; mat: MatSpec; glowHex: string }) {
  // Local to the right hand; items point forward (+Z) and up (+Y).
  switch (id) {
    case 'laser-blaster':
      return (
        <group position={[0, -0.05, 0.15]} rotation={[0.55, 0, 0]}>
          <P geo={box(0.2, 0.28, 0.75)} mat={mat} position={[0, 0.05, 0.3]} />
          <P geo={cyl(0.07, 0.07, 0.4, 12)} mat={INK()} position={[0, 0.08, 0.85]} rotation={[Math.PI / 2, 0, 0]} />
          <P geo={box(0.16, 0.3, 0.16)} mat={INK()} position={[0, -0.18, 0.05]} />
          <P geo={box(0.06, 0.06, 0.3)} mat={glow(glowHex)} position={[0, 0.22, 0.3]} />
        </group>
      );
    case 'energy-blade':
      return (
        <group rotation={[0.55, 0, 0]}>
          <P geo={cyl(0.08, 0.08, 0.4, 12)} mat={SILVER()} />
          <P geo={cyl(0.07, 0.07, 1.6, 12)} mat={glow(glowHex)} position={[0, 1.0, 0]} />
        </group>
      );
    case 'broadsword':
      return (
        <group rotation={[0.55, 0, 0]}>
          <P geo={cyl(0.07, 0.07, 0.38, 10)} mat={INK()} />
          <P geo={box(0.55, 0.08, 0.14)} mat={GOLD()} position={[0, 0.22, 0]} />
          <P geo={box(0.16, 1.5, 0.05)} mat={mat} position={[0, 1.0, 0]} />
          <P geo={<sphereGeometry args={[0.07, 10, 8]} />} mat={GOLD()} position={[0, -0.22, 0]} />
        </group>
      );
    case 'wrench':
      return (
        <group rotation={[0.55, 0, 0]}>
          <P geo={box(0.12, 1.0, 0.08)} mat={mat} position={[0, 0.35, 0]} />
          <P geo={<torusGeometry args={[0.16, 0.06, 8, 16, Math.PI * 1.5]} />} mat={mat} position={[0, 0.95, 0]} rotation={[0, 0, Math.PI * 0.75]} />
        </group>
      );
    case 'crystal-staff':
      return (
        <group>
          <P geo={cyl(0.06, 0.06, 3.0, 10)} mat={mat} position={[0, 0.6, 0]} />
          <P geo={<octahedronGeometry args={[0.26]} />} mat={glow(glowHex)} position={[0, 2.25, 0]} scale={[1, 1.5, 1]} />
        </group>
      );
    default:
      return null;
  }
}

function Shield({ mat, accent }: { mat: MatSpec; accent: MatSpec }) {
  return (
    <group position={[0.12, -0.55, 0.45]}>
      <P geo={box(1.0, 1.35, 0.12)} mat={mat} />
      <P geo={box(0.16, 1.05, 0.05)} mat={accent} position={[0, 0, 0.08]} />
      <P geo={box(0.75, 0.16, 0.05)} mat={accent} position={[0, 0.15, 0.08]} />
    </group>
  );
}

function Arm({ side, mat, handMat, raised, children }: { side: 1 | -1; mat: MatSpec; handMat: MatSpec; raised: boolean; children?: ReactNode }) {
  return (
    <group position={[0.98 * side, 2.95, 0]} rotation={[raised ? -0.6 : -0.08, 0, 0.12 * side]}>
      <P geo={<capsuleGeometry args={[0.24, 0.62, 6, 14]} />} mat={mat} position={[0, -0.45, 0]} />
      <group position={[0, -1.0, 0]}>
        <P geo={cyl(0.19, 0.19, 0.24, 14)} mat={handMat} />
        {children}
      </group>
    </group>
  );
}

function Face({ id }: { id: string }) {
  const z = 0.51;
  const eyes = (y = 3.78, w = 0.1, h = 0.14) =>
    [-0.22, 0.22].map((x) => <P key={x} geo={box(w, h, 0.03)} mat={INK()} position={[x, y, z]} />);
  const smile = (
    <P geo={<torusGeometry args={[0.2, 0.035, 8, 20, Math.PI]} />} mat={INK()} position={[0, 3.6, z]} rotation={[0, 0, Math.PI]} />
  );

  switch (id) {
    case 'hero-grin':
      return (
        <>
          {eyes()}
          {[-0.22, 0.22].map((x) => (
            <P key={`b${x}`} geo={box(0.24, 0.05, 0.03)} mat={INK()} position={[x, 3.93, z]} rotation={[0, 0, x < 0 ? -0.25 : 0.25]} />
          ))}
          <P geo={box(0.46, 0.14, 0.03)} mat={WHITE()} position={[0, 3.55, z]} />
          <P geo={box(0.5, 0.03, 0.035)} mat={INK()} position={[0, 3.55, z]} />
        </>
      );
    case 'cool-sunglasses':
      return (
        <>
          <P geo={box(0.78, 0.18, 0.05)} mat={INK()} position={[0, 3.8, z]} />
          <P geo={box(0.3, 0.04, 0.06)} mat={glow('#93c5fd')} position={[-0.2, 3.84, z + 0.01]} />
          {smile}
        </>
      );
    case 'bot-face':
      return (
        <>
          <P geo={box(0.86, 0.76, 0.04)} mat={SILVER()} position={[0, 3.72, z - 0.01]} />
          {[-0.2, 0.2].map((x) => (
            <P key={x} geo={box(0.16, 0.16, 0.03)} mat={glow('#22d3ee')} position={[x, 3.82, z + 0.02]} />
          ))}
          {[-0.15, 0, 0.15].map((x) => (
            <P key={`m${x}`} geo={box(0.06, 0.14, 0.03)} mat={INK()} position={[x, 3.52, z + 0.02]} />
          ))}
        </>
      );
    case 'pirate-eyepatch':
      return (
        <>
          <P geo={box(0.1, 0.14, 0.03)} mat={INK()} position={[0.22, 3.78, z]} />
          <P geo={cyl(0.13, 0.13, 0.04, 16)} mat={INK()} position={[-0.22, 3.8, z]} rotation={[Math.PI / 2, 0, 0]} />
          <P geo={box(1.08, 0.05, 1.04)} mat={INK()} position={[0, 3.9, 0]} rotation={[0, 0, 0.18]} />
          <P geo={box(0.3, 0.04, 0.03)} mat={INK()} position={[0.05, 3.56, z]} rotation={[0, 0, 0.2]} />
        </>
      );
    case 'battle-determination':
      return (
        <>
          {eyes(3.78, 0.16, 0.06)}
          {[-0.22, 0.22].map((x) => (
            <P key={`b${x}`} geo={box(0.26, 0.06, 0.03)} mat={INK()} position={[x, 3.9, z]} rotation={[0, 0, x < 0 ? 0.35 : -0.35]} />
          ))}
          <P geo={box(0.34, 0.05, 0.03)} mat={INK()} position={[0, 3.56, z]} />
        </>
      );
    default: // classic-smile
      return (
        <>
          {[-0.22, 0.22].map((x) => (
            <P key={x} geo={cyl(0.07, 0.07, 0.03, 14)} mat={INK()} position={[x, 3.8, z]} rotation={[Math.PI / 2, 0, 0]} />
          ))}
          {smile}
        </>
      );
  }
}

function Headgear({ id, mat, accent }: { id: string; mat: MatSpec; accent: MatSpec }) {
  const top = 4.22;
  switch (id) {
    case 'space-helmet':
      return (
        <>
          <P geo={<sphereGeometry args={[0.82, 28, 20]} />} mat={GLASS()} position={[0, 3.72, 0]} />
          <P geo={<torusGeometry args={[0.6, 0.12, 10, 28]} />} mat={mat} position={[0, 3.18, 0]} rotation={[Math.PI / 2, 0, 0]} />
          <P geo={box(0.5, 0.35, 0.2)} mat={mat} position={[0, 3.4, -0.62]} />
          <P geo={cyl(0.03, 0.03, 0.4, 8)} mat={SILVER()} position={[0.4, 4.6, -0.2]} />
          <P geo={<sphereGeometry args={[0.06, 10, 8]} />} mat={glow('#ef4444')} position={[0.4, 4.82, -0.2]} />
        </>
      );
    case 'knight-visor':
      return (
        <>
          <P geo={box(1.2, 0.25, 1.16)} mat={mat} position={[0, top + 0.02, 0]} />
          <P geo={box(1.2, 1.1, 0.12)} mat={mat} position={[0, 3.72, -0.54]} />
          {[-0.56, 0.56].map((x) => (
            <P key={x} geo={box(0.1, 1.1, 1.16)} mat={mat} position={[x, 3.72, 0]} />
          ))}
          <P geo={box(1.2, 0.3, 0.1)} mat={mat} position={[0, 4.0, 0.56]} />
          <P geo={box(1.2, 0.5, 0.1)} mat={mat} position={[0, 3.45, 0.56]} />
          <P geo={<coneGeometry args={[0.16, 0.6, 12]} />} mat={accent} position={[0, top + 0.45, -0.1]} rotation={[-0.4, 0, 0]} />
        </>
      );
    case 'ninja-hood':
      return (
        <>
          <P geo={box(1.14, 0.3, 1.1)} mat={mat} position={[0, top - 0.05, 0]} />
          <P geo={box(1.14, 1.06, 0.1)} mat={mat} position={[0, 3.72, -0.53]} />
          {[-0.54, 0.54].map((x) => (
            <P key={x} geo={box(0.08, 1.06, 1.1)} mat={mat} position={[x, 3.72, 0]} />
          ))}
          <P geo={box(1.14, 0.42, 0.08)} mat={mat} position={[0, 3.46, 0.53]} />
          <P geo={box(1.14, 0.16, 0.08)} mat={mat} position={[0, 4.04, 0.53]} />
          {[-0.12, 0.12].map((x) => (
            <P key={`t${x}`} geo={box(0.12, 0.5, 0.06)} mat={accent} position={[x, 3.6, -0.66]} rotation={[0.3, 0, x * 2]} />
          ))}
        </>
      );
    case 'spiky-hair':
      return (
        <>
          <P geo={box(1.1, 0.22, 1.06)} mat={mat} position={[0, top, 0]} />
          {[
            [-0.32, 0.2, -0.4],
            [0, 0.28, -0.2],
            [0.32, 0.2, 0.4],
            [-0.3, 0.24, 0.25],
            [0.3, 0.26, -0.25],
            [0, 0.22, 0.3],
          ].map(([x, h, tilt], i) => (
            <P
              key={i}
              geo={<coneGeometry args={[0.2, 0.55 + h, 8]} />}
              mat={mat}
              position={[x, top + 0.35, (i % 3) * 0.3 - 0.3]}
              rotation={[tilt * 0.6, 0, -x * 0.9]}
            />
          ))}
        </>
      );
    case 'wizard-hat':
      return (
        <>
          <P geo={cyl(0.88, 0.88, 0.06, 32)} mat={mat} position={[0, top + 0.02, 0]} />
          <P geo={<coneGeometry args={[0.52, 1.3, 24]} />} mat={mat} position={[0.05, top + 0.68, -0.05]} rotation={[-0.1, 0, -0.12]} />
          <P geo={cyl(0.53, 0.53, 0.14, 24, true)} mat={accent} position={[0, top + 0.12, 0]} />
          <P geo={<octahedronGeometry args={[0.1]} />} mat={GOLD()} position={[0.1, top + 0.6, 0.38]} />
        </>
      );
    case 'royal-crown':
      return (
        <>
          <P geo={cyl(0.5, 0.5, 0.28, 28, true)} mat={GOLD()} position={[0, top + 0.12, 0]} />
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <P key={i} geo={<coneGeometry args={[0.1, 0.26, 8]} />} mat={GOLD()} position={[Math.sin(a) * 0.46, top + 0.38, Math.cos(a) * 0.46]} />
            );
          })}
          <P geo={<sphereGeometry args={[0.09, 12, 10]} />} mat={glow(colorHexFromMat(mat))} position={[0, top + 0.14, 0.5]} />
        </>
      );
    case 'cyber-visor':
      return (
        <>
          <P geo={box(1.14, 0.26, 1.1)} mat={mat} position={[0, 3.8, 0]} />
          <P geo={box(0.92, 0.1, 0.04)} mat={glow('#22d3ee')} position={[0, 3.8, 0.56]} />
          {[-0.6, 0.6].map((x) => (
            <P key={x} geo={cyl(0.16, 0.16, 0.12, 16)} mat={SILVER()} position={[x, 3.75, 0]} rotation={[0, 0, Math.PI / 2]} />
          ))}
        </>
      );
    default:
      return null;
  }
}

function colorHexFromMat(m: MatSpec): string {
  const c = (m as THREE.MeshStandardMaterial).color;
  return c ? `#${c.getHexString()}` : '#ef4444';
}

/* ---------- figure ---------- */

interface BlockFigureMeshProps {
  figure: BlockFigure;
  /** Replace every material (e.g. ghost preview). */
  override?: THREE.Material;
  ghost?: boolean;
}

function BlockFigureMesh({ figure, override, ghost = false }: BlockFigureMeshProps) {
  const mat = (key: ColorKey) => brickMaterial(getColor(figureColor(figure, key))!);
  const accessoryHex = getColor(figureColor(figure, 'accessory'))!.hex;
  const skin = mat('head');
  const holdsItem = figure.accessoryId !== 'none' && figure.accessoryId !== 'tower-shield';
  const hasShield = figure.accessoryId === 'tower-shield';

  return (
    <FigureCtx.Provider value={{ override, ghost }}>
      <group>
        <Legs id={figure.legsId} mat={mat('legs')} />
        <Hips legsId={figure.legsId} mat={mat('legs')} />
        <Torso id={figure.torsoId} mat={mat('torso')} accent={mat('arms')} />

        {/* Right arm (figure's right = −X) carries the accessory; left arm carries the shield. */}
        <Arm side={-1} mat={mat('arms')} handMat={skin} raised={holdsItem && figure.accessoryId !== 'crystal-staff'}>
          {holdsItem && <Accessory id={figure.accessoryId} mat={mat('accessory')} glowHex={accessoryHex} />}
        </Arm>
        <Arm side={1} mat={mat('arms')} handMat={skin} raised={hasShield}>
          {hasShield && <Shield mat={mat('accessory')} accent={mat('torso')} />}
        </Arm>

        <P geo={cyl(0.28, 0.3, 0.14, 16)} mat={skin} position={[0, 3.16, 0]} />
        <P geo={box(1.04, 1.0, 1.0)} mat={skin} position={[0, 3.72, 0]} />
        <Face id={figure.headId} />
        <Headgear id={figure.hatId} mat={mat('headgear')} accent={mat('torso')} />
      </group>
    </FigureCtx.Provider>
  );
}

export default memo(BlockFigureMesh);
