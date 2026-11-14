/** Minimal isometric 1×1 brick: a cube with a single stud, drawn as line art. */
export default function BrandMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none" strokeLinejoin="round">
      {/* cube faces */}
      <path d="M16 11 L27 16.5 L16 22 L5 16.5 Z" fill="var(--cobalt)" stroke="var(--ink)" strokeWidth="1.5" />
      <path d="M5 16.5 L16 22 L16 30 L5 24.5 Z" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
      <path d="M27 16.5 L16 22 L16 30 L27 24.5 Z" fill="#e2e8f0" stroke="var(--ink)" strokeWidth="1.5" />
      {/* stud */}
      <path d="M11.5 13.5 V10.5 A4.5 2.25 0 0 1 20.5 10.5 V13.5 A4.5 2.25 0 0 1 11.5 13.5 Z" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
      <ellipse cx="16" cy="10.5" rx="4.5" ry="2.25" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
    </svg>
  );
}
