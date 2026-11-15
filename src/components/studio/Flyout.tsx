'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { controlBtn } from './controls';

/** The rail's panels. Only one is open at a time. */
export type StudioPanel = 'blocks' | 'figures' | 'color' | 'baseplate';

/**
 * Floating panel beside the tool rail (desktop) or a bottom sheet (phones).
 * Closes on Esc and on presses outside it, except presses on the rail itself,
 * whose buttons toggle panels on their own.
 */
export default function Flyout({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    // Focus the panel's first field or control so keyboard users land inside it.
    // Skipped on phones, where focusing the search field would pop up the keyboard.
    if (window.matchMedia('(min-width: 768px)').matches) {
      el?.querySelector<HTMLElement>('input, button:not([data-flyout-close]), select')?.focus({ preventScroll: true });
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Element | null;
      if (!target || el?.contains(target) || target.closest('[data-studio-rail]')) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      className={`pointer-events-auto fixed inset-x-0 bottom-0 z-30 flex max-h-[60dvh] flex-col border-t border-ink/15 bg-white shadow-[0_-12px_32px_-16px_rgba(15,23,42,0.4)] md:absolute md:inset-x-auto md:bottom-auto md:left-[4.5rem] md:top-20 md:max-h-[calc(100%-6.5rem)] md:border md:w-100 md:shadow-[0_16px_40px_-20px_rgba(15,23,42,0.5)]`}
    >
      <header className="flex items-center justify-between border-b border-ink/10 py-2 pl-4 pr-2">
        <h2 className="font-mono text-[10px] font-semibold tracking-[0.2em] text-ink-soft">{title.toUpperCase()}</h2>
        <button
          type="button"
          data-flyout-close
          onClick={onClose}
          aria-label={`Close ${title}`}
          className={controlBtn('idle', 'h-8 w-8')}
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
