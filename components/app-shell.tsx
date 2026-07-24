import Link from "next/link";
import Image from "next/image";
import { BookOpen, CalendarDays, ChartNoAxesCombined, FileText, Home, LogOut, Megaphone, MessageSquare, Users, HeartHandshake } from "lucide-react";
import { logoutAction } from "@/app/actions";
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

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card/90 p-4 backdrop-blur lg:block">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-2 py-3">
          <Image src="/egf-connect.png" alt="EGF Connect" width={48} height={48} className="h-12 w-12 rounded-md object-contain" />
          <div>
            <p className="font-semibold">EGF Connect</p>
            <p className="text-xs text-muted-foreground">Gather • Grow • Go</p>
          </div>
        </Link>
        <nav className="mt-6 grid gap-1">
          {visibleNav.map(([label, href]) => (
            <NavigationLink key={href} href={href} label={label} />
          ))}
        </nav>
        <form action={logoutAction} className="absolute bottom-4 left-4 right-4">
          <Button variant="outline" className="w-full">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </form>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Image src="/egf-connect.png" alt="" width={32} height={32} className="h-8 w-8 rounded object-contain" />
              <span>EGF Connect</span>
            </Link>
            <form action={logoutAction}>
              <Button variant="ghost" size="icon" aria-label="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {visibleNav.map(([label, href]) => (
              <NavigationLink key={href} href={href} label={label} mobile />
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
