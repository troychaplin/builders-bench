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

/** A request to tilt the 3D view one step; bump `id` to trigger. +1 tilts up (more overhead). */
export type ViewTilt = ViewTurn;

interface Controls {
  target: Vector3;
  update: () => void;
  getAzimuthalAngle: () => number;
  setAzimuthalAngle: (a: number) => void;
  getPolarAngle: () => number;
  setPolarAngle: (a: number) => void;
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

const TURN_STEP = Math.PI / 2;
const TILT_STEP = Math.PI / 12; // 15°
const MAX_POLAR_3D = Math.PI / 2.08; // just above the plate
const MIN_TILT_POLAR = Math.PI / 12; // 15° from vertical; 2D view covers straight overhead

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
  tilt,
}: {
  size: number;
  mode: ViewMode;
  resetNonce: number;
  turn: ViewTurn;
  tilt: ViewTilt;
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
          maxPolarAngle={MAX_POLAR_3D}
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
      <AngleAnimator request={turn} axis="azimuth" step={TURN_STEP} />
      {mode === '3d' && (
        <AngleAnimator request={tilt} axis="polar" step={-TILT_STEP} min={MIN_TILT_POLAR} max={MAX_POLAR_3D} />
      )}
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

/**
 * Animates one step around the plate: `azimuth` turns it, `polar` tilts it.
 * Each step starts from the current view (or the end of a step in progress)
 * and is clamped to [min, max].
 */
function AngleAnimator({
  request,
  axis,
  step,
  min = -Infinity,
  max = Infinity,
}: {
  request: ViewTurn;
  axis: 'azimuth' | 'polar';
  step: number;
  min?: number;
  max?: number;
}) {
  const controls = useThree((s) => s.controls) as unknown as Controls | null;
  const anim = useRef<{ from: number; to: number; start: number } | null>(null);
  const lastId = useRef(request.id);

  useEffect(() => {
    // Only react to new requests, not to remounts (e.g. switching back to 3D).
    if (!controls || request.id === lastId.current) return;
    lastId.current = request.id;
    const current = axis === 'azimuth' ? controls.getAzimuthalAngle() : controls.getPolarAngle();
    const from = anim.current?.to ?? current;
    const to = Math.min(max, Math.max(min, from + request.dir * step));
    if (Math.abs(to - from) < 1e-4) return;
    anim.current = { from, to, start: performance.now() };
  }, [request, controls, axis, step, min, max]);

  useFrame(() => {
    const a = anim.current;
    if (!a || !controls) return;
    const t = Math.min((performance.now() - a.start) / TURN_MS, 1);
    const value = a.from + (a.to - a.from) * (1 - (1 - t) ** 3);
    if (axis === 'azimuth') controls.setAzimuthalAngle(value);
    else controls.setPolarAngle(value);
    controls.update();
    if (t >= 1) anim.current = null;
  });

  return null;
}
