import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Clock, HeartHandshake, MapPin, MessageCircleHeart, MessageSquare, Sparkles, Users } from "lucide-react";
import { updateRsvpAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enumLabel, formatDate, meetingStatusText, percent } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const [memberCount, nextMeeting, latestAnnouncement, prayerRequests, upcomingMeetings, verseCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.meeting.findFirst({
        where: { date: { gte: now }, status: "PUBLISHED" },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        include: { rsvps: true }
      }),
      prisma.announcement.findFirst({
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        include: { createdBy: { select: { name: true } } }
      }),
      prisma.prayerRequest.findMany({
        where:
          user.role === "ADMIN"
            ? {}
            : { OR: [{ visibility: "PUBLIC" }, { createdById: user.id }] },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { createdBy: { select: { name: true } }, interactions: true }
      }),
      prisma.meeting.findMany({
        where: { date: { gte: now }, status: { in: ["PUBLISHED", "DRAFT"] } },
        orderBy: [{ date: "asc" }],
        take: 4
      }),
      prisma.dailyVerse.count()
    ]);

  const dailyVerse =
    verseCount > 0
      ? await prisma.dailyVerse.findFirst({
          skip: Math.floor(now.getTime() / 86_400_000) % verseCount,
          orderBy: { id: "asc" }
        })
      : null;

  const rsvps = nextMeeting?.rsvps ?? [];
  const attending = rsvps.filter((rsvp) => rsvp.status === "ATTENDING").length;
  const maybe = rsvps.filter((rsvp) => rsvp.status === "MAYBE").length;
  const notAttending = rsvps.filter((rsvp) => rsvp.status === "NOT_ATTENDING").length;
  const myRsvp = rsvps.find((rsvp) => rsvp.userId === user.id)?.status;

  return (
    <div className="grid animate-enter gap-6">
      <section className="relative overflow-hidden rounded-3xl bg-primary px-5 py-7 text-primary-foreground shadow-[0_28px_70px_-38px_hsl(var(--primary))] sm:px-8 sm:py-9">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[42px] border-white/5" aria-hidden="true" />
        <div className="absolute -bottom-20 right-28 h-44 w-44 rounded-full bg-white/5 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/75">
              <Sparkles className="h-4 w-4" /> Welcome back
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Good to see you, {user.name}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-primary-foreground/70">Here&apos;s what&apos;s happening in your fellowship community.</p>
          </div>
          <Badge className="w-fit border border-white/15 bg-white/10 px-3 py-1.5 text-primary-foreground backdrop-blur">{enumLabel(user.role)}</Badge>
        </div>
      </section>

      <section aria-label="Quick actions" className="-mt-10 grid grid-cols-2 gap-3 px-3 sm:grid-cols-4 sm:px-6">
        <QuickAction href="/meetings" icon={CalendarDays} label="Meetings" helper="View schedule" tone="teal" />
        <QuickAction href="/prayer" icon={HeartHandshake} label="Prayer" helper="Support someone" tone="rose" />
        <QuickAction href="/discussions" icon={MessageSquare} label="Discuss" helper="Join the circle" tone="gold" />
        <QuickAction href="/reading" icon={BookOpen} label="Reading" helper="Continue growing" tone="blue" />
      </section>

      <section className="mt-2 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        {nextMeeting ? (
          <Card className="overflow-hidden border-primary/10">
            <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-secondary" />
            <CardHeader className="pb-4">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Next gathering</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{nextMeeting.title}</CardTitle>
                  <CardDescription>{nextMeeting.studyTopic}</CardDescription>
                </div>
                  <Badge className="bg-primary/10 text-primary">{meetingStatusText(nextMeeting.date, nextMeeting.startTime)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex gap-2 rounded-xl bg-muted/55 p-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{formatDate(nextMeeting.date)}</span>
                </div>
                <div className="flex gap-2 rounded-xl bg-muted/55 p-3">
                  <Clock className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{nextMeeting.startTime} - {nextMeeting.endTime}</span>
                </div>
                <div className="flex gap-2 rounded-xl bg-muted/55 p-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{nextMeeting.venueName}</span>
                </div>
                <div className="flex gap-2 rounded-xl bg-muted/55 p-3">
                  <Users className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{nextMeeting.speakerName}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Passage</p>
                <p className="text-sm text-muted-foreground">{nextMeeting.biblePassage}</p>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Will you be there?</p>
                <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["ATTENDING", "Attending"],
                  ["MAYBE", "Maybe"],
                  ["NOT_ATTENDING", "Not Attending"]
                ].map(([status, label]) => (
                  <form key={status} action={updateRsvpAction}>
                    <input type="hidden" name="meetingId" value={nextMeeting.id} />
                    <input type="hidden" name="status" value={status} />
                    <Button className="w-full" variant={myRsvp === status ? "default" : "outline"}>
                      {label}
                    </Button>
                  </form>
                ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric label="Attending" value={attending} helper={`${percent(attending, memberCount)}%`} />
                <Metric label="Maybe" value={maybe} helper={`${percent(maybe, memberCount)}%`} />
                <Metric label="Not attending" value={notAttending} helper={`${percent(notAttending, memberCount)}%`} />
                <Metric label="No response" value={Math.max(memberCount - rsvps.length, 0)} helper="members" />
              </div>
              <Link className="group inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary hover:underline" href={`/meetings/${nextMeeting.id}`}>
                View meeting details <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </CardContent>
          </Card>
        ) : (
          <EmptyState title="No upcoming published meeting" body="Leaders can publish the next Bible study from Meeting Management." />
        )}

        <div className="grid gap-6">
          <Card className="group relative overflow-hidden border-secondary/50 bg-gradient-to-br from-[#fffdf7] to-secondary/55">
            <div className="absolute -right-8 -top-10 select-none font-serif text-[10rem] leading-none text-primary/[.05]" aria-hidden="true">“</div>
            <CardHeader>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Daily encouragement</p>
              <CardTitle>Today&apos;s Verse</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyVerse ? (
                <>
                  <p className="text-balance text-lg font-medium leading-8">“{dailyVerse.text}”</p>
                  <p className="mt-3 text-sm font-medium text-primary">{dailyVerse.reference}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Seed daily verses to show a verse here.</p>
              )}
            </CardContent>
          </Card>
          <Card className="border-accent/10">
            <CardHeader>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Stay connected</p>
              <CardTitle>Latest Announcement</CardTitle>
            </CardHeader>
            <CardContent>
              {latestAnnouncement ? (
                <div className="grid gap-2">
                  <Badge className="w-fit">{enumLabel(latestAnnouncement.priority)}</Badge>
                  <p className="font-medium">{latestAnnouncement.title}</p>
                  <p className="text-sm text-muted-foreground">{latestAnnouncement.body}</p>
                  <p className="text-xs text-muted-foreground">By {latestAnnouncement.createdBy.name}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No announcements yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-end justify-between space-y-0">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-accent">Care for one another</p>
              <CardTitle>Recent Prayer Requests</CardTitle>
            </div>
            <Link href="/prayer" className="text-sm font-semibold text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="grid gap-3">
            {prayerRequests.map((request) => (
              <div key={request.id} className="rounded-xl border bg-background/45 p-4 transition-colors hover:border-primary/25 hover:bg-primary/5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{request.title}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircleHeart className="h-3.5 w-3.5" />
                    {request.interactions.length}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{request.description}</p>
              </div>
            ))}
            {prayerRequests.length === 0 && <p className="text-sm text-muted-foreground">No prayer requests visible yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-end justify-between space-y-0">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-primary">Coming up</p>
              <CardTitle>Upcoming Events</CardTitle>
            </div>
            <Link href="/meetings" className="text-sm font-semibold text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="grid gap-3">
            {upcomingMeetings.map((meeting) => (
              <Link key={meeting.id} href={`/meetings/${meeting.id}`} className="group flex items-center justify-between rounded-xl border bg-background/45 p-4 transition-all hover:border-primary/25 hover:bg-primary/5">
                <div>
                  <p className="font-medium">{meeting.title}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(meeting.date)} at {meeting.startTime}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
            {upcomingMeetings.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events.</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

const quickActionTones = {
  teal: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white",
  rose: "bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white",
  gold: "bg-amber-100 text-amber-700 group-hover:bg-amber-500 group-hover:text-white",
  blue: "bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white"
};

function QuickAction({ href, icon: Icon, label, helper, tone }: { href: string; icon: typeof CalendarDays; label: string; helper: string; tone: keyof typeof quickActionTones }) {
  return (
    <Link href={href} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/80 bg-card/95 p-3 shadow-[0_16px_40px_-24px_rgba(15,55,48,.45)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_22px_46px_-24px_rgba(15,55,48,.5)] sm:p-4">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all duration-300 group-hover:rotate-3 group-hover:scale-105 ${quickActionTones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{label}</span>
        <span className="hidden truncate text-xs text-muted-foreground sm:block">{helper}</span>
      </span>
    </Link>
  );
}

function Metric({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="rounded-xl border bg-background/60 p-3 transition-colors hover:border-primary/25 hover:bg-primary/5">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xs text-primary">{helper}</p>
    </div>
  );
}
