import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock, MapPin, MessageCircleHeart, Users } from "lucide-react";
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
    <div className="grid gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-3xl font-semibold tracking-normal">{user.name}</h1>
        </div>
        <Badge className="w-fit bg-secondary text-secondary-foreground">{enumLabel(user.role)}</Badge>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        {nextMeeting ? (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{nextMeeting.title}</CardTitle>
                  <CardDescription>{nextMeeting.studyTopic}</CardDescription>
                </div>
                <Badge className="bg-primary text-primary-foreground">{meetingStatusText(nextMeeting.date, nextMeeting.startTime)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{formatDate(nextMeeting.date)}</span>
                </div>
                <div className="flex gap-2">
                  <Clock className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{nextMeeting.startTime} - {nextMeeting.endTime}</span>
                </div>
                <div className="flex gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{nextMeeting.venueName}</span>
                </div>
                <div className="flex gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{nextMeeting.speakerName}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Passage</p>
                <p className="text-sm text-muted-foreground">{nextMeeting.biblePassage}</p>
              </div>
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
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric label="Attending" value={attending} helper={`${percent(attending, memberCount)}%`} />
                <Metric label="Maybe" value={maybe} helper={`${percent(maybe, memberCount)}%`} />
                <Metric label="Not attending" value={notAttending} helper={`${percent(notAttending, memberCount)}%`} />
                <Metric label="No response" value={Math.max(memberCount - rsvps.length, 0)} helper="members" />
              </div>
              <Link className="text-sm font-medium text-primary" href={`/meetings/${nextMeeting.id}`}>
                View meeting details
              </Link>
            </CardContent>
          </Card>
        ) : (
          <EmptyState title="No upcoming published meeting" body="Leaders can publish the next Bible study from Meeting Management." />
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Verse</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyVerse ? (
                <>
                  <p className="text-lg leading-8">{dailyVerse.text}</p>
                  <p className="mt-3 text-sm font-medium text-primary">{dailyVerse.reference}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Seed daily verses to show a verse here.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
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
          <CardHeader>
            <CardTitle>Recent Prayer Requests</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {prayerRequests.map((request) => (
              <div key={request.id} className="rounded-md border p-3">
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
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {upcomingMeetings.map((meeting) => (
              <Link key={meeting.id} href={`/meetings/${meeting.id}`} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted">
                <div>
                  <p className="font-medium">{meeting.title}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(meeting.date)} at {meeting.startTime}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </Link>
            ))}
            {upcomingMeetings.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events.</p>}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Metric({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="rounded-md border bg-background/70 p-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xs text-primary">{helper}</p>
    </div>
  );
}
