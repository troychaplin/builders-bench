'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import { MOUSE, TOUCH, type Vector3 } from 'three';

export type ViewMode = '3d' | '2d';

/** A request to turn the view 90°; bump `id` to trigger. +1 turns the baseplate clockwise. */
export interface ViewTurn {
  id: number;
  dir: 1 | -1;
}

interface Controls {
  target: Vector3;
  update: () => void;
  getAzimuthalAngle: () => number;
  setAzimuthalAngle: (a: number) => void;
}

// 3D: left builds, right orbits, middle pans. One finger builds; two orbit and zoom.
const MOUSE_3D = { LEFT: null, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.ROTATE } as unknown as { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE };
const TOUCH_3D = { ONE: null, TWO: TOUCH.DOLLY_ROTATE } as unknown as { ONE: TOUCH; TWO: TOUCH };
// 2D: left builds, right and middle pan. Two fingers pan and zoom.
const MOUSE_2D = { LEFT: null, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN } as unknown as { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE };
const TOUCH_2D = { ONE: null, TWO: TOUCH.DOLLY_PAN } as unknown as { ONE: TOUCH; TWO: TOUCH };

// Looking straight down makes the camera's up vector degenerate, so stay a hair off vertical.
const TOP_DOWN_POLAR = 0.001;
const TURN_MS = 380;

/** Orthographic zoom that fits the whole baseplate, leaving room for the toolbar and BuildBins. */
function useFitZoom(size: number) {
  const viewport = useThree((s) => s.size);
  return Math.min(viewport.width, viewport.height) / (size * 1.45);
}

export default function StudioCamera({
  size,
  mode,
  resetNonce,
  turn,
}: {
  size: number;
  mode: ViewMode;
  resetNonce: number;
  turn: ViewTurn;
}) {
  const fitZoom = useFitZoom(size);

  return (
    <>
      {mode === '2d' && (
        // Remounting on reset restores the fit-to-plate zoom from props.
        <OrthographicCamera key={resetNonce} makeDefault position={[0, size * 3, 0]} zoom={fitZoom} near={0.1} far={size * 10} />
      )}
      {mode === '3d' ? (
        <OrbitControls
          key="3d"
          makeDefault
          enableDamping
          dampingFactor={0.12}
          maxPolarAngle={Math.PI / 2.08}
          minDistance={4}
          maxDistance={size * 2.6}
          mouseButtons={MOUSE_3D}
          touches={TOUCH_3D}
        />
      ) : (
        <OrbitControls
          key="2d"
          makeDefault
          enableDamping
          dampingFactor={0.12}
          enableRotate={false}
          minPolarAngle={TOP_DOWN_POLAR}
          maxPolarAngle={TOP_DOWN_POLAR}
          minZoom={fitZoom * 0.6}
          maxZoom={fitZoom * 6}
          mouseButtons={MOUSE_2D}
          touches={TOUCH_2D}
        />
      )}
      <Rig size={size} mode={mode} resetNonce={resetNonce} />
      <Turner turn={turn} />
    </>
  );
}

/** Puts the camera in its default spot for the mode; runs on mode change and on reset. */
function Rig({ size, mode, resetNonce }: { size: number; mode: ViewMode; resetNonce: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as Controls | null;

  useEffect(() => {
    if (mode === '2d') {
      camera.position.set(0, size * 3, 0);
    } else {
      camera.position.set(size * 0.8, size * 0.85, size * 0.8);
    }
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    } else {
      camera.lookAt(0, 0, 0);
    }
  }, [camera, controls, mode, size, resetNonce]);

  return null;
}

/** Animates a 90° turn around the plate, starting from wherever the view currently is. */
function Turner({ turn }: { turn: ViewTurn }) {
  const controls = useThree((s) => s.controls) as unknown as Controls | null;
  const anim = useRef<{ from: number; to: number; start: number } | null>(null);

  useEffect(() => {
    if (!controls || turn.id === 0) return;
    const from = anim.current?.to ?? controls.getAzimuthalAngle();
    anim.current = { from, to: from + turn.dir * (Math.PI / 2), start: performance.now() };
  }, [turn, controls]);

  useFrame(() => {
    const a = anim.current;
    if (!a || !controls) return;
    const t = Math.min((performance.now() - a.start) / TURN_MS, 1);
    const eased = 1 - (1 - t) ** 3;
    controls.setAzimuthalAngle(a.from + (a.to - a.from) * eased);
    controls.update();
    if (t >= 1) anim.current = null;
  });

  return null;
}
