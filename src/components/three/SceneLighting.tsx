'use client';

import { Environment, Lightformer } from '@react-three/drei';

/** Shared workshop lighting: soft key light with shadows plus a local reflection environment. */
export default function SceneLighting({ size }: { size: number }) {
  return (
    <>
      <color attach="background" args={['#eef2f7']} />
      <ambientLight intensity={0.25} />
      <hemisphereLight args={['#ffffff', '#cbd5e1', 0.45]} />
      <directionalLight
        position={[-size * 0.45, size * 0.6, size * 0.2]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-size * 0.75}
        shadow-camera-right={size * 0.75}
        shadow-camera-top={size * 0.75}
        shadow-camera-bottom={-size * 0.75}
        shadow-camera-far={size * 3}
      />
      {/* Local studio environment for reflections — no network fetch. */}
      <Environment resolution={128}>
        <Lightformer intensity={1.4} position={[0, 6, -8]} scale={[14, 6, 1]} />
        <Lightformer intensity={0.8} position={[-8, 4, 4]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer intensity={0.6} position={[8, 3, 4]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer intensity={0.6} position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} color="#e2e8f0" />
      </Environment>
    </>
  );
}
