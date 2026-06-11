'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/fitness/bodybuilding', label: 'Bodybuilding', match: (p: string) => p.startsWith('/fitness/bodybuilding') },
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
