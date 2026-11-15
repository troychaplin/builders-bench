'use client';

import { useEffect, useMemo, useState, type Dispatch } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MOUSE, TOUCH, Vector3, type Object3D } from 'three';
import { getColor, getPart } from '@/data/brickCatalog';
import { BASEPLATE_SIZE, getBaseplateColor, UNIT_H } from '@/lib/studio/constants';
import { buildOccupancy, isSupportingOthers, resolvePlacement } from '@/lib/studio/occupancy';
import { activeSelection, type StudioAction, type StudioState } from '@/lib/studio/reducer';
import { newInstanceId } from '@/lib/studio/share';
import { playBlocked, playRemove, playSnap } from '@/lib/studio/sound';
import { brickMaterial, ghostMaterial } from '@/lib/studio/three';
import CameraRig from '@/components/three/CameraRig';
import SceneLighting from '@/components/three/SceneLighting';
import BlockFigureMesh from '@/components/figures/BlockFigureMesh';
import { FIGURE_PART } from '@/lib/studio/figures';
import type { BrickPart, PlacedFigure } from '@/types/brick';
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

/** Walk up from a hit mesh to the piece it belongs to (figures are many meshes). */
function pieceId(obj: Object3D | null): string | undefined {
  for (let o = obj; o; o = o.parent) {
    const id = (o.userData as { instanceId?: string }).instanceId;
    if (id) return id;
  }
  return undefined;
}

function Workspace({ state, dispatch, onNotice, onPlacementChange, sound }: SceneProps) {
  const { project, rotation, tool } = state;
  const { partId, colorId } = activeSelection(state);
  const size = SIZE;
  const placingFigure = tool === 'figure' ? state.placingFigure : null;
  const part: BrickPart = placingFigure ? FIGURE_PART : getPart(partId)!;
  const color = getColor(colorId)!;
  const figures = useMemo(() => project.figures ?? [], [project.figures]);

  const occ = useMemo(() => buildOccupancy(project.bricks, figures), [project.bricks, figures]);
  const byId = useMemo(() => new Map(project.bricks.map((b) => [b.instanceId, b])), [project.bricks]);
  const figureById = useMemo(() => new Map(figures.map((f) => [f.instanceId, f])), [figures]);

  const [anchor, setAnchor] = useState<{ x: number; z: number } | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const placement = useMemo(
    () =>
      anchor && (tool === 'place' || placingFigure)
        ? resolvePlacement(occ, part, rotation, anchor.x, anchor.z, size)
        : null,
    [anchor, tool, placingFigure, occ, part, rotation, size],
  );

  useEffect(() => {
    onPlacementChange?.(placement ? { x: placement.x, y: placement.y, z: placement.z, valid: placement.valid } : null);
  }, [placement, onPlacementChange]);

  /** Stud cell the pointer is aiming at, nudged off the hit face. */
  function cellFromEvent(e: ThreeEvent<PointerEvent | MouseEvent>) {
    if (!e.face) return null;
    const data = e.object.userData as { baseplate?: boolean };
    const id = pieceId(e.object);
    let normal = e.face.normal.clone().transformDirection(e.object.matrixWorld);

    // Hits on the sides of studs should count as hitting the surface below.
    if (data.baseplate) normal = UP;
    else if (id) {
      const b = byId.get(id);
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
    const id = pieceId(e.object) ?? null;
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

    const id = pieceId(e.object);

    if (placingFigure) {
      const cell = cellFromEvent(e);
      const p = cell && resolvePlacement(occ, FIGURE_PART, rotation, cell.x, cell.z, size);
      if (!p) return;
      if (!p.valid) {
        if (sound) playBlocked();
        onNotice(p.reason ?? "Can't place a figure there.");
        return;
      }
      if (sound) playSnap();
      dispatch({
        type: 'placeFigure',
        figure: { instanceId: newInstanceId(), figure: placingFigure, x: p.x, y: p.y, z: p.z, rotation },
      });
      return;
    }

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

    const fig = figureById.get(id);
    if (fig) {
      if (tool !== 'erase') return;
      if (isSupportingOthers(occ, FIGURE_PART, fig, id)) return;
      if (sound) playRemove();
      dispatch({ type: 'remove', instanceId: id });
      setHoverId(null);
      return;
    }

    const target = byId.get(id);
    if (!target) return;
    const targetPart = getPart(target.partId);
    if (!targetPart) return;

    if (tool === 'erase') {
      if (isSupportingOthers(occ, targetPart, target, id)) {
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
        {figures.map((f) => (
          <PlacedFigureMesh key={f.instanceId} placed={f} highlight={hoverId === f.instanceId && tool === 'erase'} />
        ))}
      </group>

      {placement && placingFigure && (
        <group position={[placement.x + 1, placement.y * UNIT_H, placement.z + 1]} rotation-y={(-rotation * Math.PI) / 180}>
          <BlockFigureMesh figure={placingFigure} override={ghostMaterial('#22d3ee', placement.valid)} ghost />
        </group>
      )}

      {placement && !placingFigure && (
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

/** A figure on the baseplate; erase-hover tints it with a red ghost overlay. */
function PlacedFigureMesh({ placed, highlight }: { placed: PlacedFigure; highlight: boolean }) {
  return (
    <group
      position={[placed.x + 1, placed.y * UNIT_H, placed.z + 1]}
      rotation-y={(-placed.rotation * Math.PI) / 180}
      userData={{ instanceId: placed.instanceId }}
    >
      <BlockFigureMesh figure={placed.figure} override={highlight ? ghostMaterial('#ef4444', false) : undefined} />
    </group>
  );
}
