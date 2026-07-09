import Link from "next/link";
import { CalendarPlus, MapPin, Trash2 } from "lucide-react";
import { createMeetingAction, deleteMeetingAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enumLabel, formatDate, percent } from "@/lib/utils";

export default async function MeetingsPage() {
  const user = await requireUser();
  const [meetings, memberCount] = await Promise.all([
    prisma.meeting.findMany({
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
      include: { rsvps: true, attendance: true }
    }),
    prisma.user.count()
  ]);

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm text-muted-foreground">Meeting Management</p>
        <h1 className="text-3xl font-semibold">Bible Study Meetings</h1>
      </section>

      {user.role === "ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarPlus className="h-5 w-5" /> Create meeting</CardTitle>
            <CardDescription>Publish weekly Bible study details, venue, passage, and questions.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createMeetingAction} className="grid gap-4 lg:grid-cols-2">
              <Field label="Title" name="title" />
              <Field label="Study Topic" name="studyTopic" />
              <Field label="Date" name="date" type="date" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start" name="startTime" type="time" />
                <Field label="End" name="endTime" type="time" />
              </div>
              <Field label="Venue Name" name="venueName" />
              <Field label="Address" name="address" />
              <Field label="Latitude" name="latitude" type="number" step="any" />
              <Field label="Longitude" name="longitude" type="number" step="any" />
              <Field label="Speaker Name" name="speakerName" />
              <Field label="Worship Leader Name" name="worshipLeaderName" />
              <Field label="Bible Passage" name="biblePassage" />
              <div className="grid gap-2">
                <Label>Status</Label>
                <select name="status" className="h-10 rounded-md border bg-card px-3 text-sm">
                  {["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"].map((status) => (
                    <option key={status} value={status}>{enumLabel(status)}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 lg:col-span-2">
                <Label>Description</Label>
                <Textarea name="description" required />
              </div>
              <div className="grid gap-2 lg:col-span-2">
                <Label>Discussion Questions</Label>
                <Textarea name="discussionQuestions" required />
              </div>
              <Button className="lg:col-span-2">Create meeting</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4">
        {meetings.map((meeting) => {
          const attending = meeting.rsvps.filter((rsvp) => rsvp.status === "ATTENDING").length;
          return (
            <Card key={meeting.id}>
              <CardContent className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge>{enumLabel(meeting.status)}</Badge>
                    <Badge className="bg-secondary text-secondary-foreground">{formatDate(meeting.date)}</Badge>
                  </div>
                  <Link href={`/meetings/${meeting.id}`} className="text-xl font-semibold hover:text-primary">
                    {meeting.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{meeting.studyTopic} • {meeting.biblePassage}</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {meeting.venueName}
                  </p>
                </div>
                <div className="grid min-w-56 gap-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md border p-3">
                      <p className="text-lg font-semibold">{attending}</p>
                      <p className="text-muted-foreground">Attending</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="text-lg font-semibold">{percent(meeting.attendance.length, memberCount)}%</p>
                      <p className="text-muted-foreground">Attendance</p>
                    </div>
                  </div>
                  {user.role === "ADMIN" && (
                    <form action={deleteMeetingAction}>
                      <input type="hidden" name="meetingId" value={meeting.id} />
                      <Button variant="outline" className="w-full">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

function Field({ label, name, type = "text", step }: { label: string; name: string; type?: string; step?: string }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input name={name} type={type} step={step} required={type !== "number"} />
    </div>
  );
}
