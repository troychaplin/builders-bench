'use client';

import { useLayoutEffect, useRef } from 'react';
import { InstancedMesh, Matrix4 } from 'three';
import { STUD_HEIGHT, STUD_RADIUS } from '@/lib/studio/constants';

const PLATE_THICKNESS = 0.3;

/** Baseplate spanning x, z ∈ [0, size], top surface at y = 0, with instanced studs. */
export default function Baseplate({ size, color }: { size: number; color: string }) {
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
    </group>
  );
}
