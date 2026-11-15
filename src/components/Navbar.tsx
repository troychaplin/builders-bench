'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import BrandMark from '@/components/BrandMark';
import { APP_MODES, pad2 } from '@/data/modes';

const NAV_LINKS = [
  { href: '/', index: '00', label: 'Hub' },
  ...APP_MODES.map((m) => ({ href: m.href, index: pad2(m.index), label: m.navLabel })),
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/15 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-stretch justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <BrandMark />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[15px] font-bold tracking-[0.04em]">BUILDER&rsquo;S BENCH</span>
            <span className="mt-1 font-mono text-[10px] tracking-[0.18em] text-ink-soft">STUDIO // beta</span>
          </span>
        </Link>

        <ul className="hidden items-stretch md:flex">
          {NAV_LINKS.map(({ href, index, label }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href} className="flex">
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative flex items-center gap-2 px-3.5 text-sm font-medium transition-colors lg:px-4 ${
                    active ? 'text-ink' : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  <span className={`font-mono text-[10px] ${active ? 'text-cobalt' : 'text-ink-faint group-hover:text-cobalt'}`}>
                    {index}
                  </span>
                  {label}
                  <span
                    className={`absolute inset-x-3 -bottom-px h-0.5 transition-all ${
                      active ? 'bg-cobalt' : 'scale-x-0 bg-ink/30 group-hover:scale-x-100'
                    }`}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="my-auto border border-ink/20 bg-white p-1.5 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <ul className="border-t border-ink/15 bg-white/95 px-4 py-2 md:hidden">
          {NAV_LINKS.map(({ href, index, label }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium ${
                    active ? 'border-cobalt text-ink' : 'border-transparent text-ink-soft'
                  }`}
                >
                  <span className="font-mono text-[10px] text-ink-faint">{index}</span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </header>
  );
}
