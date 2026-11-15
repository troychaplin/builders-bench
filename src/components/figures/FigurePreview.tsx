'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { BlockFigure } from '@/types/brick';
import SceneLighting from '@/components/three/SceneLighting';
import Baseplate from '@/components/studio/Baseplate';
import BlockFigureMesh from './BlockFigureMesh';

/** Turntable preview of a figure on a small display baseplate. */
export default function FigurePreview({ figure, spinning }: { figure: BlockFigure; spinning: boolean }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [6, 5.2, 9.2], fov: 36 }}>
      <SceneLighting size={8} />
      <group position={[-2, 0, -2]}>
        <Baseplate size={4} color="#cfd8e3" />
      </group>
      <BlockFigureMesh figure={figure} />
      <OrbitControls
        makeDefault
        target={[0, 2.3, 0]}
        enablePan={false}
        enableDamping
        minDistance={4}
        maxDistance={14}
        maxPolarAngle={Math.PI / 1.9}
        autoRotate
        autoRotateSpeed={spinning ? 12 : 1.2}
      />
    </Canvas>
  );
}
