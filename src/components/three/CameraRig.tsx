'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { Vector3 } from 'three';

/** Puts the camera at the default three-quarter view; bump `nonce` to reset. */
export default function CameraRig({ size, nonce, targetY = 0 }: { size: number; nonce: number; targetY?: number }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as { target: Vector3; update: () => void } | null;

  useEffect(() => {
    camera.position.set(size * 0.8, size * 0.85 + targetY, size * 0.8);
    if (controls) {
      controls.target.set(0, targetY, 0);
      controls.update();
    } else {
      camera.lookAt(0, targetY, 0);
    }
  }, [camera, controls, size, nonce, targetY]);

  return null;
}
