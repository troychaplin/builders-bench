'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { CanvasTexture, InstancedMesh, Matrix4, RepeatWrapping, SRGBColorSpace } from 'three';
import { STUD_HEIGHT, STUD_RADIUS } from '@/lib/studio/constants';

const PLATE_THICKNESS = 0.3;

/** Is this plate colour dark enough to need light outlines? */
function isDark(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255) < 110;
}

/**
 * One stud ring per texture tile, repeated once per stud. Straight down, the
 * lighting can't show the studs' edges, so the top-down view draws them.
 */
function useStudRingTexture(size: number, dark: boolean) {
  const texture = useMemo(() => {
    const px = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = px;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px / 2, px / 2, STUD_RADIUS * px, 0, Math.PI * 2);
    ctx.stroke();
    const t = new CanvasTexture(canvas);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(size, size);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [size, dark]);

  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/** Baseplate spanning x, z ∈ [0, size], top surface at y = 0, with instanced studs. */
export default function Baseplate({ size, color, studOutlines = false }: { size: number; color: string; studOutlines?: boolean }) {
  const rings = useStudRingTexture(size, isDark(color));
  const studsRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = studsRef.current;
    if (!mesh) return;
    const m = new Matrix4();
    let i = 0;
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        m.makeTranslation(x + 0.5, STUD_HEIGHT / 2, z + 0.5);
        mesh.setMatrixAt(i++, m);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [size]);

  return (
    <group>
      <mesh position={[size / 2, -PLATE_THICKNESS / 2, size / 2]} receiveShadow userData={{ baseplate: true }}>
        <boxGeometry args={[size, PLATE_THICKNESS, size]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <instancedMesh
        key={size}
        ref={studsRef}
        args={[undefined, undefined, size * size]}
        receiveShadow
        userData={{ baseplate: true }}
      >
        <cylinderGeometry args={[STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 16]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </instancedMesh>
      {studOutlines && (
        // Sits just above the stud tops and ignores the pointer, so clicks still reach the plate.
        <mesh position={[size / 2, STUD_HEIGHT + 0.002, size / 2]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null} renderOrder={1}>
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial map={rings} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}
