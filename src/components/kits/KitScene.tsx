'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MeshStandardMaterial, type Group } from 'three';
import { getColor, getPart } from '@/data/brickCatalog';
import type { BuildProject, PlacedBrick } from '@/types/brick';
import CameraRig from '@/components/three/CameraRig';
import SceneLighting from '@/components/three/SceneLighting';
import Baseplate from '@/components/studio/Baseplate';
import BrickMesh from '@/components/studio/BrickMesh';
import { getBaseplateColor, normalizeBaseplateSize, UNIT_H } from '@/lib/studio/constants';
import { brickMaterial } from '@/lib/studio/three';

export const DROP_MS = 340;
const DROP_HEIGHT = 2.4; // world units the pieces fall from

interface KitSceneProps {
  project: BuildProject;
  placed: PlacedBrick[];
  current: PlacedBrick[];
  dropping: PlacedBrick[] | null;
  celebrating: boolean;
  onSnap: () => void;
  viewNonce: number;
}

export default function KitScene({ project, placed, current, dropping, celebrating, onSnap, viewNonce }: KitSceneProps) {
  // Built-in kits are 24×24; custom kits from the studio can be any supported size.
  const size = normalizeBaseplateSize(project.baseplateSize);
  const plate = getBaseplateColor(project.baseplateColor);

  // Aim the camera at the middle of the finished model.
  const targetY = useMemo(() => {
    let top = 0;
    for (const b of project.bricks) top = Math.max(top, b.y + (getPart(b.partId)?.heightUnits ?? 0));
    return (top * UNIT_H) / 2;
  }, [project.bricks]);

  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [13, 14, 13], fov: 40, near: 0.1, far: 1000 }}>
      <SceneLighting size={size} />

      <group position={[-size / 2, 0, -size / 2]}>
        <Baseplate size={size} color={plate.hex} />
        {placed.map((b) => (
          <SolidBrick key={b.instanceId} brick={b} />
        ))}
        {dropping && <DroppingStep key={dropping[0]?.instanceId} bricks={dropping} />}
        {!dropping && current.length > 0 && <HoloStep bricks={current} onSnap={onSnap} />}
      </group>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.12}
        maxPolarAngle={Math.PI / 2.08}
        minDistance={4}
        maxDistance={size * 2.2}
        autoRotate={celebrating}
        autoRotateSpeed={9}
      />
      <CameraRig size={Math.round(size * 0.67)} nonce={viewNonce} targetY={targetY} />
    </Canvas>
  );
}

function SolidBrick({ brick }: { brick: PlacedBrick }) {
  const part = getPart(brick.partId);
  const color = getColor(brick.colorId);
  if (!part || !color) return null;
  return <BrickMesh part={part} pose={brick} material={brickMaterial(color)} />;
}

let holo: MeshStandardMaterial | null = null;

/** One shared hologram material, pulsed every frame while a step is showing. */
function holoMaterial(): MeshStandardMaterial {
  holo ??= new MeshStandardMaterial({
    color: '#22d3ee',
    emissive: '#06b6d4',
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  return holo;
}

/** The current step as pulsing holographic outlines. Clicking one snaps the step. */
function HoloStep({ bricks, onSnap }: { bricks: PlacedBrick[]; onSnap: () => void }) {
  const material = holoMaterial();

  useEffect(() => () => void (document.body.style.cursor = ''), []);

  useFrame(({ clock }) => {
    const pulse = (Math.sin(clock.elapsedTime * 4) + 1) / 2;
    const m = holoMaterial();
    m.opacity = 0.22 + pulse * 0.3;
    m.emissiveIntensity = 0.6 + pulse * 0.8;
  });

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (e.delta > 6) return;
    onSnap();
  }

  return (
    <group
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    >
      {bricks.map((b) => {
        const part = getPart(b.partId);
        if (!part) return null;
        return <BrickMesh key={b.instanceId} part={part} pose={b} material={material} highlight="#06b6d4" ghost interactive />;
      })}
    </group>
  );
}

/** The step's real bricks falling onto the studs. Purely visual; timing lives in the player. */
function DroppingStep({ bricks }: { bricks: PlacedBrick[] }) {
  const ref = useRef<Group>(null);
  const start = useRef<number | null>(null);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const now = performance.now();
    start.current ??= now;
    const t = Math.min((now - start.current) / DROP_MS, 1);
    const eased = t * t; // accelerate like gravity
    g.position.y = (1 - eased) * DROP_HEIGHT;
  });

  return (
    <group ref={ref} position-y={DROP_HEIGHT}>
      {bricks.map((b) => (
        <SolidBrick key={b.instanceId} brick={b} />
      ))}
    </group>
  );
}
