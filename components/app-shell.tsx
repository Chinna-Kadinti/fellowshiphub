import Link from "next/link";
import Image from "next/image";
import { BookOpen, CalendarDays, ChartNoAxesCombined, FileText, Home, LogOut, Megaphone, MessageSquare, Users, HeartHandshake } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { MobileNavigation } from "@/components/mobile-navigation";
import { NavigationLink } from "@/components/navigation-link";
import { Button } from "@/components/ui/button";

const nav = [
  ["Dashboard", "/dashboard", Home],
  ["Meetings", "/meetings", CalendarDays],
  ["Announcements", "/announcements", Megaphone],
  ["Resources", "/resources", FileText],
  ["Prayer", "/prayer", HeartHandshake],
  ["Discussions", "/discussions", MessageSquare],
  ["Reading", "/reading", BookOpen],
  ["Directory", "/directory", Users],
  ["Reports", "/reports", ChartNoAxesCombined]
] as const;

export function AppShell({
  children,
  user
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: string };
}) {
  const visibleNav = nav.filter(([label]) => label !== "Reports" || user.role === "ADMIN");
  const initials = user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen overflow-x-hidden">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/60 bg-card/80 p-4 shadow-[12px_0_40px_-30px_rgba(15,55,48,.3)] backdrop-blur-xl lg:block">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-2 py-3">
          <Image src="/egf-connect.png" alt="EGF Connect" width={48} height={48} className="h-12 w-12 rounded-md object-contain" />
          <div>
            <p className="font-semibold">EGF Connect</p>
            <p className="text-xs text-muted-foreground">Gather • Grow • Go</p>
          </div>
        </Link>
        <p className="mt-7 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground/70">Community</p>
        <nav className="mt-2 grid gap-1">
          {visibleNav.map(([label, href]) => (
            <NavigationLink key={href} href={href} label={label} />
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 rounded-2xl border bg-background/70 p-3 backdrop-blur">
          <div className="mb-3 flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">{initials}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <Button variant="ghost" className="h-9 w-full justify-start text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Image src="/egf-connect.png" alt="" width={32} height={32} className="h-8 w-8 rounded object-contain" />
              <span>EGF Connect</span>
            </Link>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {user.role === "ADMIN" ? "Admin" : "Member"}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">{children}</main>
        <MobileNavigation links={visibleNav.map(([label, href]) => [label, href] as const)} />
      </div>
    </div>
  );
}
