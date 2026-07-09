import Link from "next/link";
import { BookOpen, CalendarDays, ChartNoAxesCombined, FileText, Home, LogOut, Megaphone, MessageSquare, Users, HeartHandshake } from "lucide-react";
import { logoutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card/90 p-4 backdrop-blur lg:block">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-2 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">FellowshipHub</p>
            <p className="text-xs text-muted-foreground">{user.role.toLowerCase()}</p>
          </div>
        </Link>
        <nav className="mt-6 grid gap-1">
          {nav.map(([label, href, Icon]) => (
            <Link
              key={href}
              href={href}
              className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground")}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
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
            <Link href="/dashboard" className="font-semibold">FellowshipHub</Link>
            <form action={logoutAction}>
              <Button variant="ghost" size="icon" aria-label="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {nav.map(([label, href, Icon]) => (
              <Link key={href} href={href} className="inline-flex shrink-0 items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
