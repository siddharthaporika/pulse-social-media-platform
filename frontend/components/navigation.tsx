"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, MessageCircle, UserRound, Settings, FileText, ImagePlus, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/inbox", label: "Inbox", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/create/text", label: "Write", icon: FileText },
  { href: "/create/media", label: "Media", icon: ImagePlus },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 sm:px-6">
        <Link href="/home" className="group flex shrink-0 items-center gap-2 rounded-xl px-1 py-1" aria-label="Pulse home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Heart className="h-5 w-5" fill="currentColor" />
          </span>
          <span className="hidden text-xl font-bold tracking-tight sm:inline">Pulse</span>
        </Link>

        <nav aria-label="Main navigation" className="ml-auto min-w-0 flex-1">
          <div className="flex items-center justify-end gap-0.5 overflow-x-auto pb-0.5 sm:gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/home" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors sm:px-3",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
