import type { BlockFigure, BrickRotation, BuildProject, PlacedBrick, PlacedFigure } from '@/types/brick';
import { DEFAULT_BASEPLATE_COLOR, DEFAULT_BASEPLATE_SIZE, HISTORY_LIMIT, RECENT_COUNT, normalizeBaseplateSize } from './constants';
import { resizeLayout } from './resize';
import { nextRotation } from './footprint';
import { newInstanceId } from './share';

export type Tool = 'place' | 'erase' | 'paint' | 'figure';

/** What undo/redo restores: every piece on the baseplate, and the baseplate's size. */
export interface Snapshot {
  bricks: PlacedBrick[];
  figures: PlacedFigure[];
  baseplateSize: number;
}

/** The block and colour being built with, plus what was used most recently. */
export interface Palette {
  partId: string;
  colorId: string;
  /** Newest first, no duplicates, at most RECENT_COUNT. */
  recentParts: string[];
  recentColors: string[];
}

export const DEFAULT_PALETTE: Palette = {
  partId: 'brick-2x4',
  colorId: 'bright-red',
  recentParts: ['brick-2x4', 'brick-2x2', 'brick-1x2', 'plate-2x4', 'slope-45-2x2', 'brick-1x1'],
  recentColors: ['bright-red', 'bright-blue', 'bright-yellow', 'forest-green', 'pure-white', 'obsidian-black'],
};

export interface StudioState {
  project: BuildProject;
  palette: Palette;
  rotation: BrickRotation;
  tool: Tool;
  /** The saved figure being placed while tool === 'figure'. */
  placingFigure: BlockFigure | null;
  past: Snapshot[];
  future: Snapshot[];
}

export type StudioAction =
  | { type: 'place'; brick: PlacedBrick }
  | { type: 'placeFigure'; figure: PlacedFigure }
  | { type: 'pickFigure'; figure: BlockFigure }
  | { type: 'remove'; instanceId: string }
  | { type: 'paint'; instanceId: string; colorId: string }
  | { type: 'clear' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'load'; project: BuildProject }
  | { type: 'selectPart'; partId: string }
  | { type: 'selectRecent'; index: number }
  | { type: 'setColor'; colorId: string }
  | { type: 'rotate' }
  | { type: 'setTool'; tool: Tool }
  | { type: 'toggleTool'; tool: Exclude<Tool, 'place'> }
  | { type: 'setBaseplateColor'; colorId: string }
  | { type: 'setBaseplateSize'; size: number }
  | { type: 'setTitle'; title: string };

export function newProject(): BuildProject {
  return {
    id: newInstanceId(),
    title: 'Untitled Build',
    author: 'Anonymous',
    createdAt: new Date().toISOString(),
    baseplateSize: DEFAULT_BASEPLATE_SIZE,
    baseplateColor: DEFAULT_BASEPLATE_COLOR,
    bricks: [],
  };
}

export function createInitialState({
  project,
  palette,
}: {
  project?: BuildProject | null;
  palette?: Palette;
}): StudioState {
  return {
    project: project ?? newProject(),
    palette: palette ?? DEFAULT_PALETTE,
    rotation: 0,
    tool: 'place',
    placingFigure: null,
    past: [],
    future: [],
  };
}

export const activeSelection = (s: StudioState): { partId: string; colorId: string } => ({
  partId: s.palette.partId,
  colorId: s.palette.colorId,
});

/** Move `id` to the front of a recents list. */
export function pushRecent(list: string[], id: string): string[] {
  return [id, ...list.filter((x) => x !== id)].slice(0, RECENT_COUNT);
}

const snapshot = (p: BuildProject): Snapshot => ({ bricks: p.bricks, figures: p.figures ?? [], baseplateSize: p.baseplateSize });

function apply(project: BuildProject, snap: Snapshot): BuildProject {
  return { ...project, bricks: snap.bricks, figures: snap.figures, baseplateSize: snap.baseplateSize };
}

/** Whether the current build fits on a baseplate of this size. */
export function canResizeTo(project: BuildProject, size: number): boolean {
  return resizeLayout(project.bricks, project.figures ?? [], project.baseplateSize, size) !== null;
}

/** Replace the pieces on the baseplate as one undoable step. */
function commit(state: StudioState, next: Partial<Snapshot>): StudioState {
  const current = snapshot(state.project);
  return {
    ...state,
    project: apply(state.project, { ...current, ...next }),
    past: [...state.past, current].slice(-HISTORY_LIMIT),
    future: [],
  };
}

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  const { bricks } = state.project;
  const figures = state.project.figures ?? [];

  switch (action.type) {
    case 'place': {
      const next = commit(state, { bricks: [...bricks, action.brick] });
      const { palette } = state;
      return {
        ...next,
        palette: {
          ...palette,
          recentParts: pushRecent(palette.recentParts, action.brick.partId),
          recentColors: pushRecent(palette.recentColors, action.brick.colorId),
        },
      };
    }

    case 'placeFigure':
      return commit(state, { figures: [...figures, action.figure] });

    case 'pickFigure':
      return { ...state, tool: 'figure', placingFigure: action.figure };

    case 'remove':
      return commit(state, {
        bricks: bricks.filter((b) => b.instanceId !== action.instanceId),
        figures: figures.filter((f) => f.instanceId !== action.instanceId),
      });

    case 'paint': {
      const target = bricks.find((b) => b.instanceId === action.instanceId);
      if (!target || target.colorId === action.colorId) return state;
      return commit(state, {
        bricks: bricks.map((b) => (b.instanceId === action.instanceId ? { ...b, colorId: action.colorId } : b)),
      });
    }

    case 'clear':
      return bricks.length || figures.length ? commit(state, { bricks: [], figures: [] }) : state;

    case 'undo': {
      const prev = state.past.at(-1);
      if (!prev) return state;
      return {
        ...state,
        project: apply(state.project, prev),
        past: state.past.slice(0, -1),
        future: [snapshot(state.project), ...state.future],
      };
    }

    case 'redo': {
      const [next, ...rest] = state.future;
      if (!next) return state;
      return {
        ...state,
        project: apply(state.project, next),
        past: [...state.past, snapshot(state.project)].slice(-HISTORY_LIMIT),
        future: rest,
      };
    }

    case 'load':
      return { ...state, project: action.project, past: [], future: [] };

    case 'selectPart':
      return { ...state, palette: { ...state.palette, partId: action.partId }, tool: 'place' };

    case 'selectRecent': {
      const partId = state.palette.recentParts[action.index];
      return partId ? { ...state, palette: { ...state.palette, partId }, tool: 'place' } : state;
    }

    case 'setColor':
      return {
        ...state,
        palette: { ...state.palette, colorId: action.colorId, recentColors: pushRecent(state.palette.recentColors, action.colorId) },
        tool: state.tool === 'erase' || state.tool === 'figure' ? 'place' : state.tool,
      };

    case 'rotate':
      return { ...state, rotation: nextRotation(state.rotation) };

    case 'setTool':
      return { ...state, tool: action.tool === 'figure' && !state.placingFigure ? 'place' : action.tool };

    case 'toggleTool':
      return { ...state, tool: state.tool === action.tool ? 'place' : action.tool };

    case 'setBaseplateSize': {
      const size = normalizeBaseplateSize(action.size);
      if (size === state.project.baseplateSize) return state;
      const moved = resizeLayout(bricks, figures, state.project.baseplateSize, size);
      if (!moved) return state; // build doesn't fit
      return commit(state, { ...moved, baseplateSize: size });
    }

    case 'setBaseplateColor':
      return { ...state, project: { ...state.project, baseplateColor: action.colorId } };

    case 'setTitle':
      return { ...state, project: { ...state.project, title: action.title.slice(0, 80) } };
  }
}
