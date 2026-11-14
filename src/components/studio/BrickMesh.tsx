'use client';

import { memo } from 'react';
import type { Material } from 'three';
import { Edges } from '@react-three/drei';
import type { BrickPart, PlacedBrick } from '@/types/brick';
import { UNIT_H } from '@/lib/studio/constants';
import { rotatedSize } from '@/lib/studio/footprint';
import { getPartGeometry, glassMaterial, rubberMaterial } from '@/lib/studio/three';

type Pose = Pick<PlacedBrick, 'x' | 'y' | 'z' | 'rotation'>;

interface BrickMeshProps {
  part: BrickPart;
  pose: Pose;
  material: Material;
  instanceId?: string;
  /** Outline colour for hover feedback (erase/paint). */
  highlight?: string | null;
  /** Ghost previews ignore pointer rays and skip shadows. */
  ghost?: boolean;
}

const noRaycast = () => null;

function BrickMesh({ part, pose, material, instanceId, highlight, ghost }: BrickMeshProps) {
  const geo = getPartGeometry(part);
  const { w, d } = rotatedSize(part, pose.rotation);
  const userData = instanceId ? { instanceId } : undefined;
  const shared = {
    userData,
    castShadow: !ghost,
    receiveShadow: !ghost,
    raycast: ghost ? noRaycast : undefined,
    dispose: null,
  };

  return (
    <group position={[pose.x + w / 2, pose.y * UNIT_H, pose.z + d / 2]} rotation-y={(-pose.rotation * Math.PI) / 180}>
      <mesh geometry={geo.body} material={material} {...shared}>
        {highlight && <Edges threshold={20} color={highlight} lineWidth={2} />}
      </mesh>
      {geo.glass && <mesh geometry={geo.glass} material={ghost ? material : glassMaterial()} {...shared} />}
      {geo.rubber && <mesh geometry={geo.rubber} material={ghost ? material : rubberMaterial()} {...shared} />}
    </group>
  );
}

export default memo(BrickMesh);
