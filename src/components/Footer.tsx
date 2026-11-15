import BrandMark from '@/components/BrandMark';

function Cell({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-ink/15 px-4 py-3 ${className}`}>
      <p className="font-mono text-[9px] tracking-[0.2em] text-ink-faint">{label}</p>
      <div className="mt-1 font-mono text-xs font-medium tracking-[0.08em] text-ink">{children}</div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-ink/15 bg-white/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid border border-ink/25 bg-white sm:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_1fr_1fr]">
          <div className="flex items-center gap-3 border-b border-ink/15 px-4 py-3 sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:border-b-0 lg:border-r">
            <BrandMark className="h-9 w-9" />
          </div>
          <Cell label="PROJECT" className="border-b sm:border-r">BUILDER&rsquo;S BENCH</Cell>
          <Cell label="GRID" className="border-b lg:border-r">24×24 STUD</Cell>
          <Cell label="SCALE" className="border-b sm:border-r">1:1</Cell>
          <Cell label="REVISION" className="border-b">BETA</Cell>
          <div className="px-4 py-3 sm:col-span-2 lg:col-span-4">
            <p className="font-mono text-[9px] tracking-[0.2em] text-ink-faint">FAIR PLAY NOTICE</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              Builder&rsquo;s Bench is an independent, non-commercial fan project created for educational
              purposes. Not affiliated with, endorsed, or sponsored by The LEGO Group. LEGO&reg; is a
              trademark of the LEGO Group of companies.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
