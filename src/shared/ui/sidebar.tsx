"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/shared/components/ui/separator";
import { 
  MdOutlineSchema as MdPipeline,
  MdAdd,
  MdLink,
  MdSettings,
  MdHelp
} from "react-icons/md";

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

const navItems: readonly NavItem[] = [
  { label: "Pipelines", href: "/pipelines", icon: MdPipeline },
  { label: "New pipeline", href: "/pipelines/new", icon: MdAdd },
  { label: "Connections", href: "/connections", icon: MdLink },
  { label: "Settings", href: "/settings", icon: MdSettings },
  { label: "Help", href: "/help", icon: MdHelp },
] as const;

function getActiveHref(
  pathname: string,
  items: readonly NavItem[]
): string | null {
  if (pathname === "/") return "/";
  const matches = items
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(href + "/"));
  if (matches.length === 0) return null;
  return matches.reduce((best, current) =>
    current.length > best.length ? current : best
  );
}

export function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  const activeHref = getActiveHref(pathname, navItems);

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-3" />
      <Separator />
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const active = item.href === activeHref;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={
                `flex items-center ${collapsed ? "justify-center" : "gap-2"} rounded-md px-3 py-2 text-sm transition-colors ` +
                (active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted")
              }
            >
              <Icon className="h-4 w-4" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
