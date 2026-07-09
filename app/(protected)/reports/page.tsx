import { AttendanceChart, RsvpPie } from "@/components/charts/reports-charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enumLabel, percent } from "@/lib/utils";

export default async function ReportsPage() {
  await requireAdmin();
  const [meetings, users, prayerCount, readingCount, completionCount] = await Promise.all([
    prisma.meeting.findMany({
      orderBy: { date: "asc" },
      include: { attendance: true, rsvps: true }
    }),
    prisma.user.findMany({ orderBy: { name: "asc" }, include: { attendance: true, readingCompletions: true } }),
    prisma.prayerInteraction.count(),
    prisma.bibleReadingPlan.count(),
    prisma.bibleReadingCompletion.count()
  ]);

  const attendanceChart = meetings.slice(-8).map((meeting) => ({
    name: meeting.title.length > 12 ? `${meeting.title.slice(0, 12)}...` : meeting.title,
    present: meeting.attendance.filter((row) => row.status === "PRESENT").length,
    absent: meeting.attendance.filter((row) => row.status === "ABSENT").length,
    excused: meeting.attendance.filter((row) => row.status === "EXCUSED").length
  }));
  const latestMeeting = meetings.filter((meeting) => meeting.rsvps.length > 0).at(-1);
  const rsvpData = latestMeeting
    ? [
        { name: "Attending", value: latestMeeting.rsvps.filter((row) => row.status === "ATTENDING").length },
        { name: "Maybe", value: latestMeeting.rsvps.filter((row) => row.status === "MAYBE").length },
        { name: "Not attending", value: latestMeeting.rsvps.filter((row) => row.status === "NOT_ATTENDING").length }
      ]
    : [];
  const meetingCount = meetings.length || 1;
  const readingCompletionRate = percent(completionCount, Math.max(readingCount * users.length, 1));

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm text-muted-foreground">Reports and Analytics</p>
        <h1 className="text-3xl font-semibold">Leader Dashboard</h1>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric title="Prayer Engagement" value={prayerCount} helper="I prayed interactions" />
        <Metric title="Reading Completion" value={`${readingCompletionRate}%`} helper="group-wide progress" />
        <Metric title="Meetings Tracked" value={meetings.length} helper="all statuses" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Meeting Attendance</CardTitle>
            <CardDescription>Present, absent, and excused counts by meeting.</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceChart data={attendanceChart} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>RSVP Summary</CardTitle>
            <CardDescription>{latestMeeting ? latestMeeting.title : "No RSVP data yet"}</CardDescription>
          </CardHeader>
          <CardContent>
            {rsvpData.length > 0 ? <RsvpPie data={rsvpData} /> : <p className="text-sm text-muted-foreground">No RSVP data yet.</p>}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Member Attendance Percentage</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3">Member</th>
                <th>Role</th>
                <th>Present</th>
                <th>Excused</th>
                <th>Attendance</th>
                <th>Reading</th>
              </tr>
            </thead>
            <tbody>
              {users.map((member) => {
                const present = member.attendance.filter((row) => row.status === "PRESENT").length;
                const excused = member.attendance.filter((row) => row.status === "EXCUSED").length;
                return (
                  <tr key={member.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{member.name}</td>
                    <td><Badge>{enumLabel(member.role)}</Badge></td>
                    <td>{present}</td>
                    <td>{excused}</td>
                    <td>{percent(present, meetingCount)}%</td>
                    <td>{percent(member.readingCompletions.length, readingCount)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value, helper }: { title: string; value: string | number; helper: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-3xl font-semibold">{value}</p>
        <p className="mt-1 font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
