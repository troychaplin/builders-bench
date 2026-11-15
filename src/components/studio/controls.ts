/**
 * Shared look for the studio's floating controls: the tool rail, top bar,
 * view controls and panels. One place to tune spacing, hover and active states.
 *
 * Active states use a soft cobalt tint rather than solid ink, so selected tools
 * read as part of the site's blueprint palette.
 */

/** A floating control group. Pair with `p-1` and `gap-0.5` for its buttons. */
export const SURFACE = 'border border-ink/15 bg-white/95 shadow-[0_8px_24px_-14px_rgba(15,23,42,0.35)] backdrop-blur';

const BTN_BASE =
  'flex shrink-0 items-center justify-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent';

const BTN_STATE = {
  idle: 'text-ink-soft hover:bg-slate-200/70 hover:text-ink',
  /** The current tool or mode. */
  active: 'bg-cobalt/10 text-cobalt ring-1 ring-inset ring-cobalt/25 hover:bg-cobalt/15',
  /** A button whose panel is open. */
  open: 'bg-slate-200/70 text-ink',
} as const;

export type ControlState = keyof typeof BTN_STATE;

/** Icon button classes. `size` sets its box, e.g. 'h-9 w-9'. */
export function controlBtn(state: ControlState = 'idle', size = 'h-9 w-9'): string {
  return `${BTN_BASE} ${size} ${BTN_STATE[state]}`;
}

/** Thin separators between button groups. */
export const DIVIDER_V = 'mx-1 h-5 w-px shrink-0 bg-ink/15';

/** Small pill buttons inside panels (categories, sizes). */
export function chip(active: boolean): string {
  return `border transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cobalt disabled:cursor-not-allowed disabled:opacity-35 ${
    active ? 'border-cobalt/40 bg-cobalt/10 text-cobalt' : 'border-ink/15 text-ink-soft hover:border-ink/30 hover:bg-slate-100 hover:text-ink'
  }`;
}

/** Larger picker tiles inside panels (blocks, figures). */
export function tile(active: boolean): string {
  return `border transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cobalt ${
    active ? 'border-cobalt/50 bg-cobalt/10' : 'border-ink/15 hover:border-ink/30 hover:bg-slate-100'
  }`;
}

/** Section headings inside panels. */
export const SECTION_LABEL = 'mb-2 font-mono text-[9px] tracking-[0.18em] text-ink-faint';
