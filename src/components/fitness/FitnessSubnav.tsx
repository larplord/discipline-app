'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/fitness/bodybuilding', label: 'Bodybuilding', match: (p: string) => p.startsWith('/fitness/bodybuilding') },
  { href: '/fitness/page-2', label: 'Page 2', match: (p: string) => p === '/fitness/page-2' },
  { href: '/fitness/page-3', label: 'Page 3', match: (p: string) => p === '/fitness/page-3' },
] as const;

export function FitnessSubnav() {
  const pathname = usePathname();

  return (
    <div className="fitness-subnav-wrap">
      <div className="fitness-subnav">
        {TABS.map(({ href, label, match }) => (
          <Link key={href} href={href} className={`fitness-subnav-item ${match(pathname) ? 'active' : ''}`}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
