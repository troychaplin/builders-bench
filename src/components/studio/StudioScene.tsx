'use client';

import { useEffect, useMemo, useState, type Dispatch } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MOUSE, TOUCH, Vector3 } from 'three';
import { getColor, getPart } from '@/data/brickCatalog';
import { BASEPLATE_SIZE, getBaseplateColor, UNIT_H } from '@/lib/studio/constants';
import { buildOccupancy, isSupportingOthers, resolvePlacement } from '@/lib/studio/occupancy';
import { activeSelection, type StudioAction, type StudioState } from '@/lib/studio/reducer';
import { newInstanceId } from '@/lib/studio/share';
import { playBlocked, playRemove, playSnap } from '@/lib/studio/sound';
import { brickMaterial, ghostMaterial } from '@/lib/studio/three';
import CameraRig from '@/components/three/CameraRig';
import SceneLighting from '@/components/three/SceneLighting';
import Baseplate from './Baseplate';
import BrickMesh from './BrickMesh';

export interface PlacementInfo {
  x: number;
  y: number;
  z: number;
  valid: boolean;
}

interface SceneProps {
  state: StudioState;
  dispatch: Dispatch<StudioAction>;
  onNotice: (message: string) => void;
  onPlacementChange?: (p: PlacementInfo | null) => void;
  /** Bump to reset the camera. */
  viewNonce: number;
  sound: boolean;
}

const SIZE = BASEPLATE_SIZE;

// Left button is reserved for building; right orbits, middle pans.
const MOUSE_BUTTONS = { LEFT: null, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.ROTATE } as unknown as {
  LEFT: MOUSE;
  MIDDLE: MOUSE;
  RIGHT: MOUSE;
};
// One finger taps to build; two fingers orbit and pinch-zoom.
const TOUCHES = { ONE: null, TWO: TOUCH.DOLLY_ROTATE } as unknown as { ONE: TOUCH; TWO: TOUCH };

export default function StudioScene(props: SceneProps) {
  const size = SIZE;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [size * 0.8, size * 0.85, size * 0.8], fov: 40, near: 0.1, far: 1000 }}
      gl={{ antialias: true, preserveDrawingBuffer: false }}
    >
      <SceneLighting size={size} />

      <group position={[-size / 2, 0, -size / 2]}>
        <Workspace {...props} />
      </group>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.12}
        maxPolarAngle={Math.PI / 2.08}
        minDistance={4}
        maxDistance={size * 2.6}
        mouseButtons={MOUSE_BUTTONS}
        touches={TOUCHES}
      />
      <CameraRig size={size} nonce={props.viewNonce} />
    </Canvas>
  );
}

const UP = new Vector3(0, 1, 0);

function Workspace({ state, dispatch, onNotice, onPlacementChange, sound }: SceneProps) {
  const { project, rotation, tool } = state;
  const { partId, colorId } = activeSelection(state);
  const size = SIZE;
  const part = getPart(partId)!;
  const color = getColor(colorId)!;

  const occ = useMemo(() => buildOccupancy(project.bricks), [project.bricks]);
  const byId = useMemo(() => new Map(project.bricks.map((b) => [b.instanceId, b])), [project.bricks]);

  const [anchor, setAnchor] = useState<{ x: number; z: number } | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const placement = useMemo(
    () => (anchor && tool === 'place' ? resolvePlacement(occ, part, rotation, anchor.x, anchor.z, size) : null),
    [anchor, tool, occ, part, rotation, size],
  );

  useEffect(() => {
    onPlacementChange?.(placement ? { x: placement.x, y: placement.y, z: placement.z, valid: placement.valid } : null);
  }, [placement, onPlacementChange]);

  /** Stud cell the pointer is aiming at, nudged off the hit face. */
  function cellFromEvent(e: ThreeEvent<PointerEvent | MouseEvent>) {
    if (!e.face) return null;
    const data = e.object.userData as { instanceId?: string; baseplate?: boolean };
    let normal = e.face.normal.clone().transformDirection(e.object.matrixWorld);

    // Hits on the sides of studs should count as hitting the surface below.
    if (data.baseplate) normal = UP;
    else if (data.instanceId) {
      const b = byId.get(data.instanceId);
      const p = b && getPart(b.partId);
      if (b && p && e.point.y >= (b.y + p.heightUnits) * UNIT_H - 1e-3) normal = UP;
    }

    const x = Math.floor(e.point.x + normal.x * 0.5 + size / 2);
    const z = Math.floor(e.point.z + normal.z * 0.5 + size / 2);
    if (x < 0 || z < 0 || x >= size || z >= size) return null;
    return { x, z };
  }

  function handleMove(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    const id = (e.object.userData as { instanceId?: string }).instanceId ?? null;
    setHoverId((prev) => (prev === id ? prev : id));
    const cell = cellFromEvent(e);
    setAnchor((prev) => (prev && cell && prev.x === cell.x && prev.z === cell.z ? prev : cell));
  }

  function handleOut() {
    setAnchor(null);
    setHoverId(null);
  }

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (e.delta > 6) return; // that was an orbit drag

    const id = (e.object.userData as { instanceId?: string }).instanceId;

    if (tool === 'place') {
      const cell = cellFromEvent(e);
      const p = cell && resolvePlacement(occ, part, rotation, cell.x, cell.z, size);
      if (!p) return;
      if (!p.valid) {
        if (sound) playBlocked();
        onNotice(p.reason ?? "Can't place there.");
        return;
      }
      if (sound) playSnap();
      dispatch({
        type: 'place',
        brick: { instanceId: newInstanceId(), partId, colorId, x: p.x, y: p.y, z: p.z, rotation },
      });
      return;
    }

    if (!id) return;
    const target = byId.get(id);
    if (!target) return;

    if (tool === 'erase') {
      if (isSupportingOthers(occ, target)) {
        if (sound) playBlocked();
        onNotice('Remove the bricks stacked on top first.');
        return;
      }
      if (sound) playRemove();
      dispatch({ type: 'remove', instanceId: id });
      setHoverId(null);
    } else if (tool === 'paint') {
      if (sound && target.colorId !== colorId) playSnap();
      dispatch({ type: 'paint', instanceId: id, colorId });
    }
  }

  const highlightColor = tool === 'erase' ? '#ef4444' : tool === 'paint' ? '#2563eb' : null;

  return (
    <>
      <group onPointerMove={handleMove} onPointerOut={handleOut} onClick={handleClick}>
        <Baseplate size={size} color={getBaseplateColor(project.baseplateColor).hex} />
        {project.bricks.map((b) => {
          const bp = getPart(b.partId);
          const bc = getColor(b.colorId);
          if (!bp || !bc) return null;
          return (
            <BrickMesh
              key={b.instanceId}
              instanceId={b.instanceId}
              part={bp}
              pose={b}
              material={brickMaterial(bc)}
              highlight={hoverId === b.instanceId ? highlightColor : null}
            />
          );
        })}
      </group>

      {placement && (
        <BrickMesh
          part={part}
          pose={{ x: placement.x, y: placement.y, z: placement.z, rotation }}
          material={ghostMaterial(color.hex, placement.valid)}
          ghost
        />
      )}
    </>
  );
}
