"use client";

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  HeartHandshake,
  Home,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Users,
  X,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

type MobileLink = readonly [label: string, href: string];

const icons: Record<string, LucideIcon> = {
  Dashboard: Home,
  Meetings: CalendarDays,
  Announcements: Megaphone,
  Resources: FileText,
  Prayer: HeartHandshake,
  Discussions: MessageSquare,
  Reading: BookOpen,
  Directory: Users,
  Reports: BarChart3
};

export function MobileNavigation({ links }: { links: readonly MobileLink[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const primaryLinks = links.filter(([label]) =>
    ["Dashboard", "Meetings", "Prayer", "Discussions"].includes(label)
  );

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-3 bottom-3 z-40 grid max-w-full grid-cols-5 overflow-x-hidden rounded-2xl border border-white/70 bg-card/90 px-1 pb-[max(.3rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_16px_45px_rgb(15_55_48_/_0.22)] backdrop-blur-xl lg:hidden"
      >
        {primaryLinks.map(([label, href]) => {
          const Icon = icons[label] ?? Menu;
          return (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={`flex min-h-14 w-full min-w-0 max-w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl px-1 text-[11px] font-semibold transition-all ${
              isActive(href) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="w-full truncate text-center">{label}</span>
          </Link>
          );
        })}
        <button
          type="button"
          aria-label="More navigation options"
          aria-expanded={open}
          aria-controls="more-navigation"
          onClick={() => setOpen(true)}
          className={`flex min-h-14 w-full min-w-0 max-w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border-0 bg-transparent px-1 text-[11px] font-medium transition-colors ${
            open ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex max-w-full items-end overflow-x-hidden bg-foreground/40 backdrop-blur-sm lg:hidden"
          onMouseDown={() => setOpen(false)}
        >
          <section
            id="more-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="More navigation"
            className="max-h-[82dvh] w-full max-w-full overflow-x-hidden overflow-y-auto rounded-t-2xl bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">Navigate</p>
                <h2 className="text-lg font-semibold">More options</h2>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </header>
            <nav className="grid grid-cols-2 gap-2" aria-label="All destinations">
              {links.map(([label, href]) => {
                const Icon = icons[label] ?? Menu;
                return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={`flex min-h-16 min-w-0 items-center gap-3 overflow-hidden rounded-xl border p-3 text-sm font-medium transition-colors ${
                    isActive(href) ? "border-primary/30 bg-primary/10 text-primary" : "bg-card hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 truncate">{label}</span>
                </Link>
                );
              })}
            </nav>
            <form action={logoutAction} className="mt-4 border-t pt-4">
              <Button variant="outline" className="w-full">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
