'use client';

import { useEffect, useMemo, useRef, useState, type Dispatch } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { Vector3, type Object3D } from 'three';
import { getColor, getPart } from '@/data/brickCatalog';
import { getBaseplateColor, UNIT_H } from '@/lib/studio/constants';
import { buildOccupancy, isSupportingOthers, resolvePlacement } from '@/lib/studio/occupancy';
import { rotatedSize } from '@/lib/studio/footprint';
import { activeSelection, type StudioAction, type StudioState } from '@/lib/studio/reducer';
import { newInstanceId } from '@/lib/studio/share';
import { playBlocked, playRemove, playSnap } from '@/lib/studio/sound';
import { brickMaterial, ghostMaterial } from '@/lib/studio/three';
import SceneLighting from '@/components/three/SceneLighting';
import BlockFigureMesh from '@/components/figures/BlockFigureMesh';
import { FIGURE_PART } from '@/lib/studio/figures';
import type { BrickPart, PlacedFigure } from '@/types/brick';
import Baseplate from './Baseplate';
import BrickMesh from './BrickMesh';
import StudioCamera, { type ViewMode, type ViewPan, type ViewTilt, type ViewTurn } from './StudioCamera';

/** A touch action waiting for confirmation from the studio's Place / Erase / Paint bar. */
export interface TouchPending {
  kind: 'place' | 'erase' | 'paint';
  valid: boolean;
  reason?: string;
}

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
  viewMode: ViewMode;
  viewTurn: ViewTurn;
  viewTilt: ViewTilt;
  viewPan: ViewPan;
  sound: boolean;
  /** Bump to drop the current touch aim / selection (Cancel). */
  aimEpoch: number;
  /** Bump to commit the pending touch action (Place / Erase / Paint button). */
  commitEpoch: number;
  onTouchPending?: (pending: TouchPending | null) => void;
}

export default function StudioScene(props: SceneProps) {
  const size = props.state.project.baseplateSize;

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

      <StudioCamera
        size={size}
        mode={props.viewMode}
        resetNonce={props.viewNonce}
        turn={props.viewTurn}
        tilt={props.viewTilt}
        pan={props.viewPan}
      />
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

/*
 * Input model
 * - Mouse: hover aims, click commits (place, erase, paint) immediately.
 * - Touch: drag or tap aims (place) or selects (erase/paint). Nothing changes
 *   until it is confirmed: tap the preview/selection again, or use the
 *   studio's confirm bar (commitEpoch). The aim stays put after the finger
 *   lifts, and after placing, so repeated confirms stack bricks.
 */
function Workspace({
  state,
  dispatch,
  onNotice,
  onPlacementChange,
  sound,
  aimEpoch,
  commitEpoch,
  onTouchPending,
  viewMode,
}: SceneProps) {
  const { project, rotation, tool } = state;
  const { partId, colorId } = activeSelection(state);
  const size = project.baseplateSize;
  const placingFigure = tool === 'figure' ? state.placingFigure : null;
  const placing = tool === 'place' || !!placingFigure;
  const part: BrickPart = placingFigure ? FIGURE_PART : getPart(partId)!;
  const color = getColor(colorId)!;
  const figures = useMemo(() => project.figures ?? [], [project.figures]);

  const occ = useMemo(() => buildOccupancy(project.bricks, figures), [project.bricks, figures]);
  const byId = useMemo(() => new Map(project.bricks.map((b) => [b.instanceId, b])), [project.bricks]);
  const figureById = useMemo(() => new Map(figures.map((f) => [f.instanceId, f])), [figures]);

  // Whether the latest input was a finger. The ref is read by handlers; the state drives rendering.
  const touchRef = useRef(false);
  const [touch, setTouch] = useState(false);

  // Aim and selection remember the epoch they were made in; Cancel bumps the epoch to drop them.
  const [aim, setAim] = useState<{ x: number; z: number; epoch: number } | null>(null);
  const [selection, setSelection] = useState<{ id: string; epoch: number } | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const anchor = aim && aim.epoch === aimEpoch ? aim : null;
  const selectedId =
    selection && selection.epoch === aimEpoch && (byId.has(selection.id) || figureById.has(selection.id))
      ? selection.id
      : null;

  // Catalog parts are shared, read-only objects, so `part` is stable for a given partId.
  // The React Compiler can't prove that and would otherwise skip this component.
  const placement = useMemo(
    () => (anchor && placing ? resolvePlacement(occ, part, rotation, anchor.x, anchor.z, size) : null),
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    [anchor, placing, occ, part, rotation, size],
  );

  useEffect(() => {
    onPlacementChange?.(placement ? { x: placement.x, y: placement.y, z: placement.z, valid: placement.valid } : null);
  }, [placement, onPlacementChange]);

  const pending = useMemo<TouchPending | null>(() => {
    if (!touch) return null;
    if (placing) return placement ? { kind: 'place', valid: placement.valid, reason: placement.reason } : null;
    if ((tool === 'erase' || tool === 'paint') && selectedId) return { kind: tool, valid: true };
    return null;
  }, [touch, placing, placement, tool, selectedId]);

  useEffect(() => {
    onTouchPending?.(pending);
  }, [pending, onTouchPending]);

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

  /** Place the active part (or figure) at a cell, with the usual rules and feedback. */
  function placeAt(cell: { x: number; z: number }) {
    const p = resolvePlacement(occ, part, rotation, cell.x, cell.z, size);
    if (!p) return;
    if (!p.valid) {
      if (sound) playBlocked();
      onNotice(p.reason ?? "Can't place there.");
      return;
    }
    if (sound) playSnap();
    if (placingFigure) {
      dispatch({
        type: 'placeFigure',
        figure: { instanceId: newInstanceId(), figure: placingFigure, x: p.x, y: p.y, z: p.z, rotation },
      });
    } else {
      dispatch({
        type: 'place',
        brick: { instanceId: newInstanceId(), partId, colorId, x: p.x, y: p.y, z: p.z, rotation },
      });
    }
  }

  /** Erase or paint one piece, depending on the tool. */
  function actOn(id: string) {
    const fig = figureById.get(id);
    if (fig) {
      if (tool !== 'erase') return;
      if (isSupportingOthers(occ, FIGURE_PART, fig, id)) {
        if (sound) playBlocked();
        onNotice('Remove the bricks stacked on top first.');
        return;
      }
      if (sound) playRemove();
      dispatch({ type: 'remove', instanceId: id });
      setHoverId(null);
      return;
    }

    const target = byId.get(id);
    const targetPart = target && getPart(target.partId);
    if (!target || !targetPart) return;

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

  /** Whether a cell falls inside the current preview's footprint. */
  function insidePreview(cell: { x: number; z: number }) {
    if (!placement) return false;
    const { w, d } = rotatedSize(part, rotation);
    return cell.x >= placement.x && cell.x < placement.x + w && cell.z >= placement.z && cell.z < placement.z + d;
  }

  // The confirm bar commits through commitEpoch; keep the latest commit logic in a ref.
  const commitRef = useRef<() => void>(() => {});
  useEffect(() => {
    commitRef.current = () => {
      if (placing && anchor) placeAt(anchor);
      else if ((tool === 'erase' || tool === 'paint') && selectedId) actOn(selectedId);
    };
  });
  const lastCommit = useRef(commitEpoch);
  useEffect(() => {
    if (commitEpoch === lastCommit.current) return;
    lastCommit.current = commitEpoch;
    commitRef.current();
  }, [commitEpoch]);

  function handlePointerDown(e: ThreeEvent<PointerEvent>) {
    const isTouch = (e.nativeEvent as PointerEvent).pointerType === 'touch';
    touchRef.current = isTouch;
    setTouch((prev) => (prev === isTouch ? prev : isTouch));
  }

  function handleMove(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    const isTouch = touchRef.current || (e.nativeEvent as PointerEvent).pointerType === 'touch';
    if (isTouch) {
      // Fingers only aim while placing; erase/paint selection happens on tap.
      if (!placing) return;
      const cell = cellFromEvent(e);
      if (cell) setAim((prev) => (prev && prev.epoch === aimEpoch && prev.x === cell.x && prev.z === cell.z ? prev : { ...cell, epoch: aimEpoch }));
      return;
    }
    const id = pieceId(e.object) ?? null;
    setHoverId((prev) => (prev === id ? prev : id));
    const cell = cellFromEvent(e);
    setAim((prev) => {
      if (!cell) return null;
      return prev && prev.epoch === aimEpoch && prev.x === cell.x && prev.z === cell.z ? prev : { ...cell, epoch: aimEpoch };
    });
  }

  function handleOut() {
    // A lifted finger leaves the aim in place; a mouse leaving the canvas clears it.
    if (touchRef.current) return;
    setAim(null);
    setHoverId(null);
  }

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (e.delta > 6) return; // that was a drag (orbit, or aiming with a finger)
    const isTouch = touchRef.current;

    if (placing) {
      const cell = cellFromEvent(e);
      if (!cell) return;
      if (!isTouch) return placeAt(cell);
      // Tap the preview to place it; tap anywhere else to move the aim there.
      if (anchor && insidePreview(cell)) placeAt(anchor);
      else setAim({ ...cell, epoch: aimEpoch });
      return;
    }

    const id = pieceId(e.object);
    if (!id) return;
    if (!isTouch) return actOn(id);
    // Tap once to select, tap the selected piece again to erase/paint it.
    if (selectedId === id) actOn(id);
    else setSelection({ id, epoch: aimEpoch });
  }

  const highlightColor = tool === 'erase' ? '#ef4444' : tool === 'paint' ? '#2563eb' : null;
  const highlightId = touch ? selectedId : hoverId;

  return (
    <>
      <group onPointerDown={handlePointerDown} onPointerMove={handleMove} onPointerOut={handleOut} onClick={handleClick}>
        <Baseplate size={size} color={getBaseplateColor(project.baseplateColor).hex} studOutlines={viewMode === '2d'} />
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
              highlight={highlightId === b.instanceId ? highlightColor : null}
            />
          );
        })}
        {figures.map((f) => (
          <PlacedFigureMesh key={f.instanceId} placed={f} highlight={highlightId === f.instanceId && tool === 'erase'} />
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
