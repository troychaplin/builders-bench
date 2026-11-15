'use client';

import type { Dispatch } from 'react';
import { BookOpen, Download, FolderOpen, Share2, Trash2, Volume2, VolumeX } from 'lucide-react';
import type { StudioAction, StudioState } from '@/lib/studio/reducer';
import { SECTION_LABEL } from './controls';

export interface ProjectActions {
  sound: boolean;
  onToggleSound: () => void;
  onShare: () => void;
  onDownload: () => void;
  onOpenFile: () => void;
  onPlayAsKit: () => void;
}

const rowCls =
  'flex w-full items-center gap-3 px-2.5 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-slate-200/70 hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent';

/** The build's name and everything you do with it as a file. */
export default function ProjectPanel({
  state,
  dispatch,
  actions,
  onDone,
}: {
  state: StudioState;
  dispatch: Dispatch<StudioAction>;
  actions: ProjectActions;
  onDone: () => void;
}) {
  const { project } = state;
  const figureCount = project.figures?.length ?? 0;
  const pieceCount = project.bricks.length + figureCount;

  const rows = [
    { id: 'share', label: 'Copy share link', icon: Share2, disabled: false, run: actions.onShare },
    { id: 'save', label: 'Save to file', icon: Download, disabled: false, run: actions.onDownload },
    { id: 'open', label: 'Open file', icon: FolderOpen, disabled: false, run: actions.onOpenFile },
    { id: 'kit', label: 'Play as Guided Kit', icon: BookOpen, disabled: !project.bricks.length, run: actions.onPlayAsKit },
  ];

  return (
    <div className="space-y-4 p-4">
      <label className="block">
        <span className={`block ${SECTION_LABEL}`}>BUILD NAME</span>
        <input
          value={project.title}
          onChange={(e) => dispatch({ type: 'setTitle', title: e.target.value })}
          className="h-9 w-full border border-ink/15 bg-white px-2.5 font-display text-sm font-bold tracking-tight outline-none transition-colors hover:border-ink/30 focus:border-cobalt"
        />
        <span className="mt-2 block font-mono text-[10px] tracking-[0.12em] text-ink-faint">
          {project.bricks.length} BRICKS{figureCount ? ` · ${figureCount} FIGURES` : ''} · {project.baseplateSize}×{project.baseplateSize} PLATE
        </span>
      </label>

      <div className="-mx-1.5 space-y-0.5">
        {rows.map(({ id, label, icon: Icon, disabled, run }) => (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => {
              run();
              onDone();
            }}
            className={rowCls}
          >
            <Icon className="h-4 w-4 shrink-0" /> {label}
          </button>
        ))}
        <button type="button" onClick={actions.onToggleSound} className={rowCls} aria-pressed={actions.sound}>
          {actions.sound ? <Volume2 className="h-4 w-4 shrink-0" /> : <VolumeX className="h-4 w-4 shrink-0" />}
          {actions.sound ? 'Sound on' : 'Sound off'}
        </button>
        {/* On desktop, Clear lives in the tool rail. */}
        <button
          type="button"
          disabled={!pieceCount}
          onClick={() => {
            const what = figureCount ? 'brick and figure' : 'brick';
            if (window.confirm(`Clear every ${what} from the baseplate? You can undo this.`)) {
              dispatch({ type: 'clear' });
              onDone();
            }
          }}
          className={`${rowCls} md:hidden`}
        >
          <Trash2 className="h-4 w-4 shrink-0" /> Clear baseplate
        </button>
      </div>
    </div>
  );
}
