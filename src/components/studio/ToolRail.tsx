'use client';

import type { Dispatch, ReactNode } from 'react';
import { Eraser, Grid3x3, Grip, PaintBucket, Redo2, RotateCw, Trash2, Undo2, UserRound } from 'lucide-react';
import { getColor, getPart } from '@/data/brickCatalog';
import { activeSelection, type StudioAction, type StudioState } from '@/lib/studio/reducer';
import type { StudioPanel } from './Flyout';
import PartThumb from './PartThumb';
import { inkOn, swatchStyle } from './Swatch';
import { SURFACE, controlBtn } from './controls';

function RailButton({
  label,
  shortcut,
  active,
  expanded,
  disabled,
  onClick,
  className = '',
  children,
}: {
  className?: string;
  label: string;
  shortcut?: string;
  active?: boolean;
  /** Set for buttons that open a panel. */
  expanded?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const tip = shortcut ? `${label} (${shortcut})` : label;
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={expanded === undefined ? active : undefined}
      aria-expanded={expanded}
      disabled={disabled}
      onClick={onClick}
      className={`${className} group relative ${controlBtn(active ? 'active' : expanded ? 'open' : 'idle', 'h-10 w-10 md:h-11 md:w-11')}`}
    >
      {children}
      {/* Desktop tooltip to the right of the rail. */}
      <span className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 hidden -translate-y-1/2 whitespace-nowrap bg-ink px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow transition-opacity group-hover:opacity-100 md:block">
        {tip}
      </span>
    </button>
  );
}

const Divider = ({ className = '' }: { className?: string }) => (
  <span className={`${className} mx-1 h-6 w-px shrink-0 bg-ink/15 md:mx-auto md:my-1 md:h-px md:w-6`} aria-hidden="true" />
);

/**
 * The studio's main tools. A floating vertical rail on the left on desktop;
 * a horizontal bar along the bottom on phones.
 */
export default function ToolRail({
  state,
  dispatch,
  panel,
  onPanel,
}: {
  state: StudioState;
  dispatch: Dispatch<StudioAction>;
  panel: StudioPanel | null;
  onPanel: (p: StudioPanel) => void;
}) {
  const { tool, rotation, project } = state;
  const sel = activeSelection(state);
  const part = getPart(sel.partId);
  const color = getColor(sel.colorId);
  const pieceCount = project.bricks.length + (project.figures?.length ?? 0);

  return (
    <div
      data-studio-rail
      role="toolbar"
      aria-label="Build tools"
      className={`pointer-events-auto flex max-w-full items-center overflow-x-auto p-1 md:flex-col md:gap-0.5 md:overflow-visible ${SURFACE}`}
    >
      <RailButton
        label={part ? `Blocks: ${part.name}` : 'Blocks'}
        shortcut="B"
        active={tool === 'place' && panel !== 'blocks'}
        expanded={panel === 'blocks'}
        onClick={() => onPanel('blocks')}
      >
        {part && color ? (
          <span style={{ color: inkOn(color.hex) }}>
            <PartThumb part={part} fill={color.hex} className="h-6 w-8" />
          </span>
        ) : (
          <Grid3x3 className="h-5 w-5" />
        )}
      </RailButton>
      <RailButton label={color ? `Colour: ${color.name}` : 'Colour'} shortcut="C" expanded={panel === 'color'} onClick={() => onPanel('color')}>
        {color && <span className="h-6 w-6 rounded-sm border border-ink/25" style={swatchStyle(color)} />}
      </RailButton>
      <RailButton label="Paint" shortcut="P" active={tool === 'paint'} onClick={() => dispatch({ type: 'toggleTool', tool: 'paint' })}>
        <PaintBucket className="h-5 w-5" />
      </RailButton>
      <RailButton label="Eraser" shortcut="X" active={tool === 'erase'} onClick={() => dispatch({ type: 'toggleTool', tool: 'erase' })}>
        <Eraser className="h-5 w-5" />
      </RailButton>
      <RailButton label={`Rotate piece (${rotation}°)`} shortcut="R" onClick={() => dispatch({ type: 'rotate' })}>
        <span className="flex flex-col items-center leading-none">
          <RotateCw className="h-4 w-4" />
          <span className="mt-0.5 font-mono text-[9px] tabular-nums">{rotation}°</span>
        </span>
      </RailButton>

      <Divider />

      <RailButton label="Baseplate" expanded={panel === 'baseplate'} onClick={() => onPanel('baseplate')}>
        <Grip className="h-5 w-5" />
      </RailButton>
      <RailButton
        label={tool === 'figure' && state.placingFigure ? `Figures: ${state.placingFigure.name}` : 'Figures'}
        shortcut="F"
        active={tool === 'figure' && panel !== 'figures'}
        expanded={panel === 'figures'}
        onClick={() => onPanel('figures')}
      >
        <UserRound className="h-5 w-5" />
      </RailButton>

      {/* History lives in the top bar on phones, where the rail runs out of room. */}
      <Divider className="max-md:hidden" />

      <RailButton className="max-md:hidden" label="Undo" shortcut="⌘Z" disabled={!state.past.length} onClick={() => dispatch({ type: 'undo' })}>
        <Undo2 className="h-5 w-5" />
      </RailButton>
      <RailButton className="max-md:hidden" label="Redo" shortcut="⇧⌘Z" disabled={!state.future.length} onClick={() => dispatch({ type: 'redo' })}>
        <Redo2 className="h-5 w-5" />
      </RailButton>
      <RailButton
        label="Clear baseplate"
        disabled={!pieceCount}
        onClick={() => {
          const what = project.figures?.length ? 'brick and figure' : 'brick';
          if (window.confirm(`Clear every ${what} from the baseplate? You can undo this.`)) dispatch({ type: 'clear' });
        }}
      >
        <Trash2 className="h-5 w-5" />
      </RailButton>
    </div>
  );
}
