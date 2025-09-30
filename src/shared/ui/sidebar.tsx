'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
}

const navItems: readonly NavItem[] = [
  { label: 'Pipelines', href: '/pipelines' },
  { label: 'New pipeline', href: '/pipelines/new' },
  { label: 'Connections', href: '/connections' },
  { label: 'Settings', href: '/settings' },
  { label: 'Help', href: '/help' },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-3 border-b" />
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ` +
                (active
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted')
              }
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}


