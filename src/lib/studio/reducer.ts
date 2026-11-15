import type { BlockFigure, BrickRotation, BuildProject, PlacedBrick, PlacedFigure } from '@/types/brick';
import { BASEPLATE_SIZE, DEFAULT_BASEPLATE_COLOR, HISTORY_LIMIT } from './constants';
import { DEFAULT_BINS, type BuildBin } from './bins';
import { nextRotation } from './footprint';
import { newInstanceId } from './share';

export type Tool = 'place' | 'erase' | 'paint' | 'figure';

/** What undo/redo restores: every piece on the baseplate. */
export interface Snapshot {
  bricks: PlacedBrick[];
  figures: PlacedFigure[];
}

export interface StudioState {
  project: BuildProject;
  bins: BuildBin[];
  activeBin: number;
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
  | { type: 'selectBin'; index: number }
  | { type: 'setBin'; index: number; bin: Partial<BuildBin> }
  | { type: 'loadBins'; bins: BuildBin[] }
  | { type: 'setColor'; colorId: string }
  | { type: 'rotate' }
  | { type: 'setTool'; tool: Tool }
  | { type: 'toggleTool'; tool: Exclude<Tool, 'place'> }
  | { type: 'setBaseplateColor'; colorId: string }
  | { type: 'setTitle'; title: string };

export function newProject(): BuildProject {
  return {
    id: newInstanceId(),
    title: 'Untitled Build',
    author: 'Anonymous',
    createdAt: new Date().toISOString(),
    baseplateSize: BASEPLATE_SIZE,
    baseplateColor: DEFAULT_BASEPLATE_COLOR,
    bricks: [],
  };
}

export function createInitialState({
  project,
  bins,
}: {
  project?: BuildProject | null;
  bins?: BuildBin[];
}): StudioState {
  return {
    project: project ?? newProject(),
    bins: bins ?? DEFAULT_BINS,
    activeBin: 0,
    rotation: 0,
    tool: 'place',
    placingFigure: null,
    past: [],
    future: [],
  };
}

export const activeSelection = (s: StudioState): BuildBin => s.bins[s.activeBin];

const snapshot = (p: BuildProject): Snapshot => ({ bricks: p.bricks, figures: p.figures ?? [] });

function apply(project: BuildProject, snap: Snapshot): BuildProject {
  return { ...project, bricks: snap.bricks, figures: snap.figures };
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
    case 'place':
      return commit(state, { bricks: [...bricks, action.brick] });

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

    case 'selectBin':
      return { ...state, activeBin: action.index, tool: 'place' };

    case 'setBin':
      return {
        ...state,
        bins: state.bins.map((b, i) => (i === action.index ? { ...b, ...action.bin } : b)),
      };

    case 'loadBins':
      return { ...state, bins: action.bins, activeBin: 0, tool: 'place' };

    case 'setColor':
      // The color bar recolors the active bin, so the HUD always shows what you're placing.
      return {
        ...state,
        bins: state.bins.map((b, i) => (i === state.activeBin ? { ...b, colorId: action.colorId } : b)),
        tool: state.tool === 'erase' || state.tool === 'figure' ? 'place' : state.tool,
      };

    case 'rotate':
      return { ...state, rotation: nextRotation(state.rotation) };

    case 'setTool':
      return { ...state, tool: action.tool === 'figure' && !state.placingFigure ? 'place' : action.tool };

    case 'toggleTool':
      return { ...state, tool: state.tool === action.tool ? 'place' : action.tool };

    case 'setBaseplateColor':
      return { ...state, project: { ...state.project, baseplateColor: action.colorId } };

    case 'setTitle':
      return { ...state, project: { ...state.project, title: action.title.slice(0, 80) } };
  }
}
