import { SidebarNav } from '@/shared/ui/sidebar';
import Link from 'next/link';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { LogoutButton } from '@/features';

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen w-full flex">
      <aside className="sticky top-0 h-screen w-64 shrink-0 border-r bg-background">
        <div className="h-full flex flex-col">
          <div className="px-4 py-4 border-b">
            <Link href="/" className="text-base font-semibold">
              Город 6
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SidebarNav />
          </div>
          <div className="px-4 py-4 border-t">
            <div className="flex items-center justify-between gap-2">
              <ThemeToggle />
              <LogoutButton />
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}


