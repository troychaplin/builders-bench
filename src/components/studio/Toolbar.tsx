'use client';

import { useEffect, useRef, useState, type Dispatch, type ReactNode } from 'react';
import { BookOpen, Download, FolderOpen, MoreHorizontal, Redo2, Share2, Undo2, Volume2, VolumeX } from 'lucide-react';
import type { StudioAction, StudioState } from '@/lib/studio/reducer';
import { CARTRIDGE_EXT } from '@/lib/studio/share';
import { DIVIDER_V, SURFACE, controlBtn } from './controls';

function IconButton({
  label,
  shortcut,
  onClick,
  disabled,
  children,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      onClick={onClick}
      disabled={disabled}
      className={`${controlBtn('idle', 'h-9 min-w-9 px-2')} text-sm font-medium`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className={DIVIDER_V} aria-hidden="true" />;

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

/** Slim top bar: the build's name, history, file actions and sharing. Tools live in the rail. */
export default function Toolbar({ state, dispatch, sound, onToggleSound, onShare, onDownload, onLoadFile, onPlayAsKit }: ToolbarProps) {
  const { past, future, project } = state;
  const fileRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [menuOpen]);

  const fileActions = [
    { id: 'save', label: 'Save to file', icon: Download, disabled: false },
    { id: 'open', label: 'Open file', icon: FolderOpen, disabled: false },
    { id: 'kit', label: 'Play as Guided Kit', icon: BookOpen, disabled: !project.bricks.length },
    { id: 'sound', label: sound ? 'Mute sounds' : 'Unmute sounds', icon: sound ? Volume2 : VolumeX, disabled: false },
  ] as const;

  function run(id: (typeof fileActions)[number]['id']) {
    if (id === 'save') onDownload();
    else if (id === 'open') fileRef.current?.click();
    else if (id === 'kit') onPlayAsKit();
    else onToggleSound();
  }

  return (
    <div className={`flex items-center gap-0.5 p-1 ${SURFACE}`}>
      <label className="flex h-9 min-w-0 items-center px-2.5">
        <span className="sr-only">Build title</span>
        <input
          value={project.title}
          onChange={(e) => dispatch({ type: 'setTitle', title: e.target.value })}
          className="w-28 min-w-0 border-b border-transparent bg-transparent font-display text-sm font-bold tracking-tight outline-none transition-colors hover:border-ink/20 focus:border-cobalt sm:w-40 lg:w-48"
        />
      </label>

      {/* On desktop, undo and redo live in the tool rail. */}
      <div className="flex items-center gap-0.5 md:hidden">
        <Divider />
        <IconButton label="Undo" shortcut="⌘Z" disabled={!past.length} onClick={() => dispatch({ type: 'undo' })}>
          <Undo2 className="h-4 w-4" />
        </IconButton>
        <IconButton label="Redo" shortcut="⇧⌘Z" disabled={!future.length} onClick={() => dispatch({ type: 'redo' })}>
          <Redo2 className="h-4 w-4" />
        </IconButton>
      </div>

      <Divider />

      {/* File actions inline from sm up; behind a menu on phones. */}
      <div className="hidden items-center gap-0.5 sm:flex">
        {fileActions.map(({ id, label, icon: Icon, disabled }) => (
          <IconButton key={id} label={label} onClick={() => run(id)} disabled={disabled}>
            <Icon className="h-4 w-4" />
            {id === 'kit' && <span className="hidden lg:inline">Play as Kit</span>}
          </IconButton>
        ))}
      </div>
      <div ref={menuRef} className="relative sm:hidden">
        <IconButton label="More actions" onClick={() => setMenuOpen((o) => !o)}>
          <MoreHorizontal className="h-4 w-4" />
        </IconButton>
        {menuOpen && (
          <div role="menu" className={`absolute right-0 top-11 z-40 w-48 p-1 ${SURFACE}`}>
            {fileActions.map(({ id, label, icon: Icon, disabled }) => (
              <button
                key={id}
                type="button"
                role="menuitem"
                disabled={disabled}
                onClick={() => {
                  setMenuOpen(false);
                  run(id);
                }}
                className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-slate-200/70 hover:text-ink disabled:opacity-35"
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        )}
      </div>
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

      <button
        type="button"
        onClick={onShare}
        className="ml-1 flex h-9 shrink-0 items-center gap-1.5 bg-cobalt px-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>
    </div>
  );
}
