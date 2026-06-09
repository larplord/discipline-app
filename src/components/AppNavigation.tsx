'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  label: string;
  href: string;
  icon: string;
  eyebrow?: string;
};

const MAIN_NAV: NavItem[] = [
  { label: 'Agent', href: '/dashboard', icon: '🤖', eyebrow: 'AI tools and automation' },
  { label: 'Business', href: '/work-agents', icon: '💼', eyebrow: 'Projects and operations' },
  { label: 'Life', href: '/habits', icon: '♡', eyebrow: 'Personal growth and balance' },
];

const BUSINESS_NAV: NavItem[] = [
  { label: 'Work agents', href: '/work-agents', icon: '🤖' },
  { label: 'Projects', href: '/projects', icon: '▣' },
  { label: 'Activity', href: '/business-activity', icon: '⌁' },
  { label: 'Plan', href: '/business-plan', icon: '□' },
];

const LIFE_NAV: NavItem[] = [
  { label: 'Health', href: '/fitness', icon: '✚' },
  { label: 'Sleep', href: '/fitness/sleep', icon: '☾' },
  { label: 'Daily', href: '/habits', icon: '☼' },
  { label: '???', href: '/goals', icon: '?' },
];

export function getNavSection(pathname: string) {
  if (pathname.startsWith('/work-agents') || pathname.startsWith('/projects') || pathname.startsWith('/business-activity') || pathname.startsWith('/business-plan')) return 'business';
  if (pathname.startsWith('/fitness') || pathname.startsWith('/routine') || pathname.startsWith('/habits') || pathname.startsWith('/goals') || pathname.startsWith('/journal') || pathname.startsWith('/identity') || pathname.startsWith('/focus')) return 'life';
  return 'agent';
}

export function MainBottomNav() {
  const pathname = usePathname();
  const section = getNavSection(pathname);

  return (
    <nav className="hud-main-nav" aria-label="Main navigation">
      {MAIN_NAV.map((item) => {
        const key = item.label.toLowerCase();
        const active = section === key;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`hud-main-nav-item ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="hud-main-icon" aria-hidden="true">{item.icon}</span>
            <span className="hud-main-copy">
              <strong>{item.label}</strong>
              <small>{item.eyebrow}</small>
            </span>
            <span className="hud-main-arrow" aria-hidden="true">›</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SectionTopNav() {
  const pathname = usePathname();
  const section = getNavSection(pathname);
  const items = section === 'business' ? BUSINESS_NAV : section === 'life' ? LIFE_NAV : [];

  if (items.length === 0) return null;

  return (
    <nav className="hud-section-nav" aria-label={`${section} section navigation`}>
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== '/fitness' && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            href={item.href}
            key={item.label}
            className={`hud-section-nav-item ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            <strong>{item.label}</strong>
          </Link>
        );
      })}
    </nav>
  );
}
