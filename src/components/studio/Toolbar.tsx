'use client';

import { useRef, type Dispatch, type ReactNode } from 'react';
import {
  BookOpen,
  Download,
  Eraser,
  FolderOpen,
  PaintBucket,
  Plus,
  Redo2,
  RotateCw,
  Share2,
  Trash2,
  Undo2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BASEPLATE_COLORS, getBaseplateColor } from '@/lib/studio/constants';
import type { StudioAction, StudioState, Tool } from '@/lib/studio/reducer';
import { CARTRIDGE_EXT } from '@/lib/studio/share';

const TOOLS: { id: Tool; label: string; key: string; icon: typeof Plus }[] = [
  { id: 'place', label: 'Build', key: 'Esc', icon: Plus },
  { id: 'erase', label: 'Eraser', key: 'X', icon: Eraser },
  { id: 'paint', label: 'Paint', key: 'P', icon: PaintBucket },
];

function IconButton({
  label,
  shortcut,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={shortcut ? `${label} (${shortcut})` : label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 shrink-0 items-center gap-1.5 px-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt disabled:cursor-not-allowed disabled:opacity-35 ${
        active ? 'bg-ink text-white' : 'text-ink-soft hover:bg-slate-100 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-0.5 h-5 w-px shrink-0 bg-ink/15" aria-hidden="true" />;

interface ToolbarProps {
  state: StudioState;
  dispatch: Dispatch<StudioAction>;
  sound: boolean;
  onToggleSound: () => void;
  onShare: () => void;
  onDownload: () => void;
  onLoadFile: (file: File) => void;
  onPlayAsKit: () => void;
}

export default function Toolbar({
  state,
  dispatch,
  sound,
  onToggleSound,
  onShare,
  onDownload,
  onLoadFile,
  onPlayAsKit,
}: ToolbarProps) {
  const { tool, rotation, past, future, project } = state;
  const plate = getBaseplateColor(project.baseplateColor);
  const pieceCount = project.bricks.length + (project.figures?.length ?? 0);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-y-1 border border-ink/15 bg-white/95 px-1 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.35)] backdrop-blur">
      <label className="flex h-9 min-w-0 items-center px-2">
        <span className="sr-only">Build title</span>
        <input
          value={project.title}
          onChange={(e) => dispatch({ type: 'setTitle', title: e.target.value })}
          className="w-36 min-w-0 border-b border-transparent bg-transparent font-display text-sm font-bold tracking-tight outline-none transition-colors hover:border-ink/20 focus:border-cobalt lg:w-44"
        />
      </label>

      <Divider />

      <div role="toolbar" aria-label="Tools" className="flex items-center">
        {TOOLS.map(({ id, label, key, icon: Icon }) => (
          <IconButton
            key={id}
            label={label}
            shortcut={key}
            active={tool === id}
            onClick={() => dispatch({ type: 'setTool', tool: id })}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden 2xl:inline">{label}</span>
          </IconButton>
        ))}
      </div>

      <IconButton label={`Rotate clockwise (currently ${rotation}°)`} shortcut="R" onClick={() => dispatch({ type: 'rotate' })}>
        <RotateCw className="h-4 w-4" />
        <span className="w-7 text-left font-mono text-[11px] tabular-nums">{rotation}°</span>
      </IconButton>

      <Divider />

      <IconButton label="Undo" shortcut="⌘Z" disabled={!past.length} onClick={() => dispatch({ type: 'undo' })}>
        <Undo2 className="h-4 w-4" />
      </IconButton>
      <IconButton label="Redo" shortcut="⇧⌘Z" disabled={!future.length} onClick={() => dispatch({ type: 'redo' })}>
        <Redo2 className="h-4 w-4" />
      </IconButton>
      <IconButton
        label="Clear baseplate"
        disabled={!pieceCount}
        onClick={() => {
          const what = project.figures?.length ? 'brick and figure' : 'brick';
          if (window.confirm(`Clear every ${what} from the baseplate? You can undo this.`)) dispatch({ type: 'clear' });
        }}
      >
        <Trash2 className="h-4 w-4" />
        <span>Clear</span>
      </IconButton>

      <Divider />

      <div className="flex h-9 items-center gap-1 px-1.5" role="radiogroup" aria-label={`Baseplate color: ${plate.name}`}>
        {BASEPLATE_COLORS.map((c) => {
          const selected = c.id === plate.id;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${c.name} baseplate`}
              title={`${c.name} baseplate`}
              onClick={() => dispatch({ type: 'setBaseplateColor', colorId: c.id })}
              className={`h-4 w-4 rounded-full border transition-transform hover:scale-110 ${
                selected ? 'border-ink ring-2 ring-cobalt ring-offset-1' : 'border-ink/25'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          );
        })}
      </div>

      <IconButton label={sound ? 'Mute sounds' : 'Unmute sounds'} active={false} onClick={onToggleSound}>
        {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </IconButton>

      <Divider />

      <IconButton label="Download build cartridge" onClick={onDownload}>
        <Download className="h-4 w-4" />
      </IconButton>
      <IconButton label="Load build cartridge" onClick={() => fileRef.current?.click()}>
        <FolderOpen className="h-4 w-4" />
      </IconButton>
      <input
        ref={fileRef}
        type="file"
        accept={`${CARTRIDGE_EXT},.json,application/json`}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onLoadFile(file);
          e.target.value = '';
        }}
      />

      <IconButton label="Play as Guided Kit" disabled={!project.bricks.length} onClick={onPlayAsKit}>
        <BookOpen className="h-4 w-4" />
        <span className="hidden xl:inline">Play as Kit</span>
      </IconButton>

      <button
        type="button"
        onClick={onShare}
        className="ml-1 flex h-8 shrink-0 items-center gap-1.5 bg-cobalt px-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>
    </div>
  );
}
