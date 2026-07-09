import { notFound } from "next/navigation";
import { CheckCircle2, MapPinned, Navigation, UserCheck } from "lucide-react";
import {
  adminAttendanceAction,
  checkInAction,
  createVolunteerAction,
  updateArrivalStatusAction,
  updateRsvpAction
} from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enumLabel, formatDate, formatDateTime, googleMapsUrl, percent } from "@/lib/utils";

export default async function MeetingDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const [meeting, users] = await Promise.all([
    prisma.meeting.findUnique({
      where: { id: params.id },
      include: {
        rsvps: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { updatedAt: "desc" } },
        attendance: { include: { user: { select: { id: true, name: true } } } },
        resources: true,
        volunteerAssignments: { include: { user: { select: { id: true, name: true } } } }
      }
    }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true } })
  ]);

  if (!meeting) notFound();

  const attending = meeting.rsvps.filter((rsvp) => rsvp.status === "ATTENDING").length;
  const maybe = meeting.rsvps.filter((rsvp) => rsvp.status === "MAYBE").length;
  const notAttending = meeting.rsvps.filter((rsvp) => rsvp.status === "NOT_ATTENDING").length;
  const notResponded = Math.max(users.length - meeting.rsvps.length, 0);
  const myRsvp = meeting.rsvps.find((rsvp) => rsvp.userId === user.id);
  const myAttendance = meeting.attendance.find((row) => row.userId === user.id);

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge>{enumLabel(meeting.status)}</Badge>
          <h1 className="mt-3 text-3xl font-semibold">{meeting.title}</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">{meeting.description}</p>
        </div>
        <a href={googleMapsUrl(meeting.address, meeting.latitude, meeting.longitude)} target="_blank" rel="noreferrer">
          <Button>
            <Navigation className="h-4 w-4" />
            Open in Google Maps
          </Button>
        </a>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Meeting Details</CardTitle>
            <CardDescription>{formatDate(meeting.date)} • {meeting.startTime} - {meeting.endTime}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Info label="Venue" value={`${meeting.venueName}, ${meeting.address}`} />
            <Info label="Coordinates" value={meeting.latitude && meeting.longitude ? `${meeting.latitude}, ${meeting.longitude}` : "Not provided"} />
            <Info label="Speaker" value={meeting.speakerName} />
            <Info label="Worship Leader" value={meeting.worshipLeaderName} />
            <Info label="Bible Passage" value={meeting.biblePassage} />
            <Info label="Study Topic" value={meeting.studyTopic} />
            <Info label="Discussion Questions" value={meeting.discussionQuestions} />
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>RSVP</CardTitle>
              <CardDescription>Your response: {myRsvp ? enumLabel(myRsvp.status) : "Not responded"}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                ["ATTENDING", "Attending"],
                ["MAYBE", "Maybe"],
                ["NOT_ATTENDING", "Not Attending"]
              ].map(([status, label]) => (
                <form key={status} action={updateRsvpAction}>
                  <input type="hidden" name="meetingId" value={meeting.id} />
                  <input type="hidden" name="status" value={status} />
                  <Button className="w-full" variant={myRsvp?.status === status ? "default" : "outline"}>{label}</Button>
                </form>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
                <Metric label="Attending" value={attending} />
                <Metric label="Maybe" value={maybe} />
                <Metric label="Not attending" value={notAttending} />
                <Metric label="No response" value={notResponded} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Arrival and Check-in</CardTitle>
              <CardDescription>{myAttendance ? `Checked in ${myAttendance.checkInTime ? formatDateTime(myAttendance.checkInTime) : ""}` : "Check in when you arrive."}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["NOT_STARTED", "Not started"],
                  ["ON_THE_WAY", "On the way"],
                  ["REACHED", "Reached"]
                ].map(([status, label]) => (
                  <form key={status} action={updateArrivalStatusAction}>
                    <input type="hidden" name="meetingId" value={meeting.id} />
                    <input type="hidden" name="arrivalStatus" value={status} />
                    <Button className="w-full px-2" variant={myRsvp?.arrivalStatus === status ? "default" : "outline"}>{label}</Button>
                  </form>
                ))}
              </div>
              <form action={checkInAction}>
                <input type="hidden" name="meetingId" value={meeting.id} />
                <Button className="w-full">
                  <CheckCircle2 className="h-4 w-4" />
                  Check In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Volunteers</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {meeting.volunteerAssignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between rounded-md border p-3">
                <span>{enumLabel(assignment.role)}</span>
                <span className="font-medium">{assignment.user?.name || assignment.notes || "Unassigned"}</span>
              </div>
            ))}
            {meeting.volunteerAssignments.length === 0 && <p className="text-sm text-muted-foreground">No volunteer assignments yet.</p>}
            {user.role === "ADMIN" && (
              <form action={createVolunteerAction} className="grid gap-3 border-t pt-4">
                <input type="hidden" name="meetingId" value={meeting.id} />
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <select name="role" className="h-10 rounded-md border bg-card px-3 text-sm">
                    {["SPEAKER", "WORSHIP_LEADER", "OPENING_PRAYER", "CLOSING_PRAYER", "HOSPITALITY", "SETUP", "REFRESHMENTS", "PHOTOGRAPHY", "CHILDREN_MINISTRY"].map((role) => (
                      <option key={role} value={role}>{enumLabel(role)}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Member</Label>
                  <select name="userId" className="h-10 rounded-md border bg-card px-3 text-sm">
                    <option value="">Unassigned</option>
                    {users.map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <Input name="notes" placeholder="Optional notes" />
                <Button>Save volunteer</Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
            <CardDescription>{percent(meeting.attendance.filter((row) => row.status === "PRESENT").length, users.length)}% present</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {user.role === "ADMIN" ? (
              users.map((member) => {
                const row = meeting.attendance.find((item) => item.userId === member.id);
                return (
                  <form key={member.id} action={adminAttendanceAction} className="grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{row ? enumLabel(row.status) : "Not marked"}</p>
                    </div>
                    <div className="flex gap-2">
                      <input type="hidden" name="meetingId" value={meeting.id} />
                      <input type="hidden" name="userId" value={member.id} />
                      <select name="status" defaultValue={row?.status || "PRESENT"} className="h-10 rounded-md border bg-card px-3 text-sm">
                        {["PRESENT", "ABSENT", "EXCUSED"].map((status) => (
                          <option key={status} value={status}>{enumLabel(status)}</option>
                        ))}
                      </select>
                      <Button variant="outline"><UserCheck className="h-4 w-4" /> Mark</Button>
                    </div>
                  </form>
                );
              })
            ) : (
              <div className="rounded-md border p-4 text-sm">
                Your attendance status: <span className="font-medium">{myAttendance ? enumLabel(myAttendance.status) : "Not marked"}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {user.role === "ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle>RSVP Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {meeting.rsvps.map((rsvp) => (
              <div key={rsvp.id} className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
                <span className="font-medium">{rsvp.user.name}</span>
                <span>{enumLabel(rsvp.status)}</span>
                <span className="text-muted-foreground">{enumLabel(rsvp.arrivalStatus)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
