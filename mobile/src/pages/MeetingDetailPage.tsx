import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  Route,
  Save,
  UserCheck,
  UsersRound
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  InlineNotice,
  LoadingScreen,
  Metric,
  ScreenHeader,
  SelectField
} from "../components/ui";
import { api, ApiError, queryKeys } from "../lib/api";
import {
  enumLabel,
  firstErrorMessage,
  formatCalendarDate,
  formatDateTime,
  googleMapsUrl,
  percent,
  summarizeRsvps
} from "../lib/format";
import { openExternal } from "../lib/native";
import type {
  ArrivalStatus,
  Attendance,
  AttendanceStatus,
  Meeting,
  MeetingMember,
  RsvpStatus,
  User,
  VolunteerInput,
  VolunteerRole
} from "../types";

const rsvpOptions: Array<[RsvpStatus, string]> = [
  ["ATTENDING", "Attending"],
  ["MAYBE", "Maybe"],
  ["NOT_ATTENDING", "Not Attending"]
];

const arrivalOptions: Array<[ArrivalStatus, string]> = [
  ["NOT_STARTED", "Not started"],
  ["ON_THE_WAY", "On the way"],
  ["REACHED", "Reached"]
];

const volunteerRoles: VolunteerRole[] = [
  "SPEAKER",
  "WORSHIP_LEADER",
  "OPENING_PRAYER",
  "CLOSING_PRAYER",
  "HOSPITALITY",
  "SETUP",
  "REFRESHMENTS",
  "PHOTOGRAPHY",
  "CHILDREN_MINISTRY"
];

export function MeetingDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const detail = useQuery({
    enabled: Boolean(id),
    queryKey: queryKeys.meeting(id),
    queryFn: () => api.meeting(id)
  });

  async function refreshMeeting() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.meeting(id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: queryKeys.reports })
    ]);
  }

  const rsvpMutation = useMutation({
    mutationFn: (status: RsvpStatus) => api.updateRsvp(id, status),
    onSuccess: refreshMeeting
  });
  const arrivalMutation = useMutation({
    mutationFn: (arrivalStatus: ArrivalStatus) => api.updateArrival(id, arrivalStatus),
    onSuccess: refreshMeeting
  });
  const checkInMutation = useMutation({
    mutationFn: () => api.checkIn(id),
    onSuccess: refreshMeeting
  });

  if (detail.isPending) return <LoadingScreen label="Loading meeting details…" />;
  if (detail.isError) {
    if (detail.error instanceof ApiError && detail.error.status === 404) {
      return (
        <EmptyState
          action={<Link className="button button--primary button--md" to="/meetings">Back to meetings</Link>}
          body="It may have been removed, or the link is no longer valid."
          title="Meeting not found"
        />
      );
    }
    return <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />;
  }

  const { meeting, users } = detail.data;
  const currentUser = detail.data.currentUser ?? user;
  const myRsvp =
    detail.data.myRsvp ??
    meeting.rsvps?.find((item) => item.userId === currentUser?.id) ??
    null;
  const myAttendance =
    detail.data.myAttendance ??
    meeting.attendance?.find((item) => item.userId === currentUser?.id) ??
    null;
  const summary =
    detail.data.rsvpSummary ??
    summarizeRsvps(meeting.rsvps, users.length);
  const presentCount = meeting.attendance?.filter((row) => row.status === "PRESENT").length ?? 0;
  const presentPercent = detail.data.presentPercent ?? percent(presentCount, users.length);
  const mutationError = rsvpMutation.error ?? arrivalMutation.error ?? checkInMutation.error;

  return (
    <div className="page-stack meeting-detail">
      <button className="back-link" onClick={() => navigate(-1)} type="button">
        <ArrowLeft aria-hidden="true" size={18} />
        Meetings
      </button>
      <ScreenHeader
        action={
          <Button
            onClick={() => void openExternal(googleMapsUrl(meeting.address, meeting.latitude, meeting.longitude))}
          >
            <Navigation aria-hidden="true" size={18} />
            <span className="desktop-label">Open in Google Maps</span>
            <span className="mobile-label">Directions</span>
          </Button>
        }
        description={meeting.description}
        eyebrow={enumLabel(meeting.status)}
        title={meeting.title}
      />

      <div className="meeting-detail__lead">
        <Card>
          <div className="card__header">
            <h2>Meeting Details</h2>
            <p>{formatCalendarDate(meeting.date)} · {meeting.startTime} – {meeting.endTime}</p>
          </div>
          <div className="detail-facts">
            <DetailFact icon={<CalendarDays size={18} />} label="Date" value={formatCalendarDate(meeting.date)} />
            <DetailFact icon={<Clock3 size={18} />} label="Time" value={`${meeting.startTime} – ${meeting.endTime}`} />
            <DetailFact icon={<MapPin size={18} />} label="Venue" value={`${meeting.venueName}, ${meeting.address}`} />
            <DetailFact
              icon={<Route size={18} />}
              label="Coordinates"
              value={
                meeting.latitude !== null &&
                meeting.latitude !== undefined &&
                meeting.longitude !== null &&
                meeting.longitude !== undefined
                  ? `${meeting.latitude}, ${meeting.longitude}`
                  : "Not provided"
              }
            />
          </div>
          <div className="info-grid">
            <Info label="Speaker" value={meeting.speakerName} />
            <Info label="Worship Leader" value={meeting.worshipLeaderName} />
            <Info label="Bible Passage" value={meeting.biblePassage} />
            <Info label="Study Topic" value={meeting.studyTopic} />
            <Info className="info--wide" label="Discussion Questions" value={meeting.discussionQuestions} />
          </div>
        </Card>

        <div className="meeting-detail__actions">
          <Card>
            <div className="card__header">
              <h2>RSVP</h2>
              <p>Your response: {myRsvp ? enumLabel(myRsvp.status) : "Not responded"}</p>
            </div>
            <div className="choice-list">
              {rsvpOptions.map(([status, label]) => (
                <Button
                  aria-pressed={myRsvp?.status === status}
                  disabled={rsvpMutation.isPending}
                  key={status}
                  onClick={() => rsvpMutation.mutate(status)}
                  variant={myRsvp?.status === status ? "primary" : "outline"}
                >
                  {myRsvp?.status === status ? <CheckCircle2 aria-hidden="true" size={18} /> : null}
                  {label}
                </Button>
              ))}
            </div>
            <div className="metrics-grid metrics-grid--four">
              <Metric compact label="Attending" value={summary.attending} />
              <Metric compact label="Maybe" value={summary.maybe} />
              <Metric compact label="Not going" value={summary.notAttending} />
              <Metric compact label="No response" value={summary.noResponse} />
            </div>
          </Card>

          <Card>
            <div className="card__header">
              <h2>Arrival and Check-in</h2>
              <p>
                {myAttendance
                  ? `Checked in${myAttendance.checkInTime ? ` ${formatDateTime(myAttendance.checkInTime)}` : ""}`
                  : "Check in when you arrive."}
              </p>
            </div>
            <div className="segmented-actions">
              {arrivalOptions.map(([status, label]) => (
                <Button
                  aria-pressed={myRsvp?.arrivalStatus === status}
                  disabled={arrivalMutation.isPending}
                  key={status}
                  onClick={() => arrivalMutation.mutate(status)}
                  size="sm"
                  variant={myRsvp?.arrivalStatus === status ? "primary" : "outline"}
                >
                  {label}
                </Button>
              ))}
            </div>
            <Button
              className="button--full"
              loading={checkInMutation.isPending}
              onClick={() => checkInMutation.mutate()}
            >
              <CheckCircle2 aria-hidden="true" size={18} />
              {myAttendance ? "Check in again" : "Check In"}
            </Button>
            {mutationError ? <InlineNotice tone="error">{firstErrorMessage(mutationError)}</InlineNotice> : null}
          </Card>
        </div>
      </div>

      <div className="content-grid">
        <VolunteersCard
          isAdmin={currentUser?.role === "ADMIN"}
          meeting={meeting}
          onSaved={refreshMeeting}
          users={users}
        />
        <AttendanceCard
          attendance={meeting.attendance ?? []}
          isAdmin={currentUser?.role === "ADMIN"}
          meetingId={meeting.id}
          myAttendance={myAttendance}
          onSaved={refreshMeeting}
          presentPercent={presentPercent}
          users={users}
        />
      </div>

      {currentUser?.role === "ADMIN" ? (
        <Card>
          <div className="card__header card__header--row">
            <div>
              <h2>RSVP Details</h2>
              <p>Member responses and travel status.</p>
            </div>
            <Badge tone="muted">{meeting.rsvps?.length ?? 0} responses</Badge>
          </div>
          {meeting.rsvps?.length ? (
            <div className="roster-list">
              {meeting.rsvps.map((rsvp) => (
                <div className="roster-row" key={rsvp.id}>
                  <span className="avatar">{initials(rsvp.user?.name ?? "Member")}</span>
                  <span className="roster-row__person">
                    <strong>{rsvp.user?.name ?? "Member"}</strong>
                    <small>{rsvp.user?.email}</small>
                  </span>
                  <Badge tone={rsvp.status === "ATTENDING" ? "success" : rsvp.status === "NOT_ATTENDING" ? "muted" : "gold"}>
                    {enumLabel(rsvp.status)}
                  </Badge>
                  <span className="arrival-label">{enumLabel(rsvp.arrivalStatus)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-copy">No responses yet.</p>
          )}
        </Card>
      ) : null}
    </div>
  );
}

function DetailFact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="detail-fact">
      <span className="detail-fact__icon">{icon}</span>
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

function Info({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <small className="section-label">{label}</small>
      <p className="multiline-copy">{value}</p>
    </div>
  );
}

function VolunteersCard({
  meeting,
  users,
  isAdmin,
  onSaved
}: {
  meeting: Meeting;
  users: MeetingMember[];
  isAdmin: boolean;
  onSaved: () => Promise<void>;
}) {
  const [role, setRole] = useState<VolunteerRole>("SPEAKER");
  const [userId, setUserId] = useState("");
  const [notes, setNotes] = useState("");
  const save = useMutation({
    mutationFn: (input: VolunteerInput) => api.saveVolunteer(meeting.id, input),
    onSuccess: async () => {
      setNotes("");
      await onSaved();
    }
  });

  return (
    <Card>
      <div className="card__header card__header--row">
        <h2>Volunteers</h2>
        <UsersRound aria-hidden="true" className="primary-icon" size={21} />
      </div>
      <div className="assignment-list">
        {meeting.volunteerAssignments?.map((assignment) => (
          <div className="assignment-row" key={assignment.id}>
            <span>{enumLabel(assignment.role)}</span>
            <strong>{assignment.user?.name || assignment.notes || "Unassigned"}</strong>
          </div>
        ))}
        {!meeting.volunteerAssignments?.length ? <p className="muted-copy">No volunteer assignments yet.</p> : null}
      </div>
      {isAdmin ? (
        <form
          className="embedded-form"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({
              role,
              userId: userId || undefined,
              notes: notes.trim() || undefined
            });
          }}
        >
          <h3>Assign a volunteer</h3>
          <SelectField label="Role" onChange={(event) => setRole(event.target.value as VolunteerRole)} value={role}>
            {volunteerRoles.map((item) => <option key={item} value={item}>{enumLabel(item)}</option>)}
          </SelectField>
          <SelectField label="Member" onChange={(event) => setUserId(event.target.value)} value={userId}>
            <option value="">Unassigned</option>
            {users.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </SelectField>
          <Field label="Optional notes" onChange={(event) => setNotes(event.target.value)} value={notes} />
          {save.isError ? <InlineNotice tone="error">{firstErrorMessage(save.error)}</InlineNotice> : null}
          <Button loading={save.isPending} type="submit">
            <Save aria-hidden="true" size={18} />
            Save volunteer
          </Button>
        </form>
      ) : null}
    </Card>
  );
}

function AttendanceCard({
  meetingId,
  users,
  attendance,
  myAttendance,
  isAdmin,
  presentPercent,
  onSaved
}: {
  meetingId: string;
  users: MeetingMember[];
  attendance: Attendance[];
  myAttendance: Attendance | null;
  isAdmin: boolean;
  presentPercent: number;
  onSaved: () => Promise<void>;
}) {
  return (
    <Card>
      <div className="card__header card__header--row">
        <div>
          <h2>Attendance</h2>
          <p>{presentPercent}% present</p>
        </div>
        <UserCheck aria-hidden="true" className="primary-icon" size={21} />
      </div>
      {isAdmin ? (
        <div className="attendance-list">
          {users.map((member) => (
            <AttendanceRow
              key={member.id}
              meetingId={meetingId}
              member={member}
              onSaved={onSaved}
              row={attendance.find((item) => item.userId === member.id)}
            />
          ))}
        </div>
      ) : (
        <div className="member-status">
          <span className="list-icon"><UserCheck aria-hidden="true" size={19} /></span>
          <span>
            <small>Your attendance status</small>
            <strong>{myAttendance ? enumLabel(myAttendance.status) : "Not marked"}</strong>
          </span>
        </div>
      )}
    </Card>
  );
}

function AttendanceRow({
  meetingId,
  member,
  row,
  onSaved
}: {
  meetingId: string;
  member: MeetingMember;
  row?: Attendance;
  onSaved: () => Promise<void>;
}) {
  const [status, setStatus] = useState<AttendanceStatus>(row?.status ?? "PRESENT");
  useEffect(() => {
    setStatus(row?.status ?? "PRESENT");
  }, [row?.status]);

  const save = useMutation({
    mutationFn: () => api.markAttendance(meetingId, member.id, status),
    onSuccess: onSaved
  });

  return (
    <div className="attendance-row">
      <span className="avatar">{initials(member.name)}</span>
      <span className="attendance-row__person">
        <strong>{member.name}</strong>
        <small>{row ? enumLabel(row.status) : "Not marked"}</small>
      </span>
      <select
        aria-label={`Attendance for ${member.name}`}
        className="input select attendance-row__select"
        onChange={(event) => setStatus(event.target.value as AttendanceStatus)}
        value={status}
      >
        {(["PRESENT", "ABSENT", "EXCUSED"] as const).map((item) => (
          <option key={item} value={item}>{enumLabel(item)}</option>
        ))}
      </select>
      <Button
        aria-label={`Save attendance for ${member.name}`}
        loading={save.isPending}
        onClick={() => save.mutate()}
        size="icon"
        variant="outline"
      >
        <UserCheck aria-hidden="true" size={18} />
      </Button>
      {save.isError ? <p className="attendance-row__error">{firstErrorMessage(save.error)}</p> : null}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}
