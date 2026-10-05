"use client";

import {
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  FileText,
  HeartHandshake,
  Home,
  Megaphone,
  MessageSquare,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function NavigationLink({
  href,
  label,
  mobile = false
}: {
  href: string;
  label: string;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
  const icons = {
    Dashboard: Home,
    Meetings: CalendarDays,
    Announcements: Megaphone,
    Resources: FileText,
    Prayer: HeartHandshake,
    Discussions: MessageSquare,
    Reading: BookOpen,
    Directory: Users,
    Reports: ChartNoAxesCombined
  };
  const Icon = icons[label as keyof typeof icons] ?? Home;

  useEffect(() => {
    if (mobile && active) {
      linkRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [active, mobile]);

  return (
    <Link
      ref={linkRef}
      href={href}
      prefetch={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        mobile
          ? "inline-flex shrink-0 border bg-card"
          : "text-muted-foreground hover:translate-x-0.5 hover:bg-primary/5 hover:text-primary",
        active && "border-primary/30 bg-primary text-primary-foreground shadow-[0_12px_24px_-14px_hsl(var(--primary))] hover:bg-primary hover:text-primary-foreground"
      )}
    >
      <Icon className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden="true" />
      {label}
    </Link>
  );
}
