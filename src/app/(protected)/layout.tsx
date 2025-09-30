"use client";
import { SidebarNav } from '@/shared/ui/sidebar';
import Link from 'next/link';
import { ThemeToggle } from '@/shared/ui/theme-toggle';
import { LogoutButton } from '@/features';
import { Separator } from '@/shared/components/ui/separator';
import { Button } from '@/shared/components/ui/button';
import { useState } from 'react';
import { WSIndicator } from '@/shared/ui/WSIndicator';
import { WSProvider } from '@/shared/api/ws/provider';
import { Toaster } from '@/shared/components/ui/sonner';

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <WSProvider>
    <div className="min-h-screen w-full flex">
      <aside className={`sticky top-0 h-screen shrink-0 bg-background border-r transition-[width] duration-200 ${collapsed ? 'w-[72px]' : 'w-64'}`}>
        <div className="h-full flex flex-col">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              {!collapsed && (
                <Link href="/" className="text-base font-semibold">
                  Город 6
                </Link>
              )}
              <Button
                variant="outline"
                size="icon"
                aria-label={collapsed ? 'Развернуть панель' : 'Свернуть панель'}
                onClick={() => setCollapsed((v) => !v)}
                className="border"
              >
                {collapsed ? '⮞' : '⮜'}
              </Button>
            </div>
          </div>
          <Separator />
          <div className="flex-1 overflow-y-auto">
            <SidebarNav collapsed={collapsed} />
          </div>
          <Separator />
          <div className="px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <ThemeToggle />
              <div className="flex items-center gap-2">
                <WSIndicator />
                {!collapsed && <LogoutButton />}
              </div>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
    <Toaster richColors position="bottom-right" />
    </WSProvider>
  );
}


