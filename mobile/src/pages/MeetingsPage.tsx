import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarPlus,
  Clock3,
  MapPin,
  Trash2,
  UsersRound
} from "lucide-react";
import { type Resolver, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
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
  Modal,
  ScreenHeader,
  SelectField,
  TextAreaField
} from "../components/ui";
import { api, queryKeys } from "../lib/api";
import {
  calendarDateTile,
  enumLabel,
  firstErrorMessage,
  formatCalendarDate,
  percent
} from "../lib/format";
import type { CreateMeetingInput, Meeting, MeetingStatus } from "../types";

const optionalNumber = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.coerce.number().finite().optional()
);

const meetingSchema = z.object({
  title: z.string().trim().min(3, "Use at least 3 characters."),
  studyTopic: z.string().trim().min(2, "Enter a study topic."),
  date: z.string().min(1, "Choose a date."),
  startTime: z.string().min(4, "Choose a start time."),
  endTime: z.string().min(4, "Choose an end time."),
  venueName: z.string().trim().min(2, "Enter a venue."),
  address: z.string().trim().min(3, "Enter an address."),
  latitude: optionalNumber,
  longitude: optionalNumber,
  speakerName: z.string().trim().min(2, "Enter the speaker’s name."),
  worshipLeaderName: z.string().trim().min(2, "Enter the worship leader’s name."),
  biblePassage: z.string().trim().min(2, "Enter the Bible passage."),
  status: z.enum(["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"]),
  description: z.string().trim().min(5, "Use at least 5 characters."),
  discussionQuestions: z.string().trim().min(5, "Add at least one discussion question.")
});

type MeetingFormValues = z.infer<typeof meetingSchema>;

const blankMeeting: MeetingFormValues = {
  title: "",
  studyTopic: "",
  date: "",
  startTime: "",
  endTime: "",
  venueName: "",
  address: "",
  latitude: undefined,
  longitude: undefined,
  speakerName: "",
  worshipLeaderName: "",
  biblePassage: "",
  status: "DRAFT",
  description: "",
  discussionQuestions: ""
};

function statusTone(status: MeetingStatus) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "CANCELLED") return "danger" as const;
  if (status === "COMPLETED") return "muted" as const;
  return "gold" as const;
}

export function MeetingsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const meetings = useQuery({
    queryKey: queryKeys.meetings,
    queryFn: api.meetings
  });
  const deleteMeeting = useMutation({
    mutationFn: api.deleteMeeting,
    onSuccess: async () => {
      setDeleteTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.meetings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reports })
      ]);
    }
  });

  if (meetings.isPending) return <LoadingScreen label="Loading meetings…" />;
  if (meetings.isError) {
    return <ErrorState error={meetings.error} onRetry={() => void meetings.refetch()} />;
  }

  return (
    <div className="page-stack">
      <ScreenHeader
        action={
          user?.role === "ADMIN" ? (
            <Button onClick={() => setCreateOpen(true)}>
              <CalendarPlus aria-hidden="true" size={18} />
              <span className="desktop-label">Create meeting</span>
              <span className="mobile-label">Create</span>
            </Button>
          ) : undefined
        }
        description="Schedules, responses, attendance, and volunteer coordination."
        eyebrow="Meeting Management"
        title="Bible Study Meetings"
      />

      {meetings.data.meetings.length ? (
        <div className="meeting-list">
          {meetings.data.meetings.map((meeting) => {
            const tile = calendarDateTile(meeting.date);
            const attending =
              meeting.rsvpSummary?.attending ??
              meeting.rsvps?.filter((item) => item.status === "ATTENDING").length ??
              0;
            const attendancePercent =
              meeting.attendanceSummary?.percent ??
              percent(meeting.attendance?.length ?? 0, meetings.data.memberCount);
            return (
              <Card className="meeting-list-card" key={meeting.id}>
                <div className="meeting-list-card__date">
                  <strong>{tile.day}</strong>
                  <span>{tile.month}</span>
                </div>
                <div className="meeting-list-card__main">
                  <div className="badge-row">
                    <Badge tone={statusTone(meeting.status)}>{enumLabel(meeting.status)}</Badge>
                    <Badge tone="muted">{formatCalendarDate(meeting.date)}</Badge>
                  </div>
                  <Link className="meeting-list-card__title" to={`/meetings/${meeting.id}`}>
                    {meeting.title}
                  </Link>
                  <p>{meeting.studyTopic} · {meeting.biblePassage}</p>
                  <div className="meeting-list-card__facts">
                    <span><Clock3 aria-hidden="true" size={16} />{meeting.startTime} – {meeting.endTime}</span>
                    <span><MapPin aria-hidden="true" size={16} />{meeting.venueName}</span>
                  </div>
                </div>
                <div className="meeting-list-card__metrics">
                  <Metric compact label="Attending" value={attending} />
                  <Metric compact label="Attendance" value={`${attendancePercent}%`} />
                </div>
                <div className="meeting-list-card__actions">
                  {user?.role === "ADMIN" ? (
                    <Button
                      aria-label={`Delete ${meeting.title}`}
                      onClick={() => setDeleteTarget(meeting)}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 aria-hidden="true" size={19} />
                    </Button>
                  ) : null}
                  <Link aria-label={`Open ${meeting.title}`} className="icon-link" to={`/meetings/${meeting.id}`}>
                    <ArrowRight aria-hidden="true" size={20} />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          body={user?.role === "ADMIN" ? "Create the first meeting to get started." : "There are no meetings to show yet."}
          icon={<UsersRound aria-hidden="true" size={24} />}
          title="No meetings yet"
        />
      )}

      {user?.role === "ADMIN" ? (
        <CreateMeetingModal open={createOpen} onClose={() => setCreateOpen(false)} />
      ) : null}

      <Modal
        destructive
        description={
          deleteTarget
            ? `This permanently removes “${deleteTarget.title}” and its RSVP, attendance, resource links, and volunteer records.`
            : undefined
        }
        footer={
          <>
            <Button disabled={deleteMeeting.isPending} onClick={() => setDeleteTarget(null)} variant="ghost">Cancel</Button>
            <Button
              loading={deleteMeeting.isPending}
              onClick={() => deleteTarget && deleteMeeting.mutate(deleteTarget.id)}
              variant="danger"
            >
              <Trash2 aria-hidden="true" size={18} />
              Delete meeting
            </Button>
          </>
        }
        onClose={() => setDeleteTarget(null)}
        open={Boolean(deleteTarget)}
        title="Delete this meeting?"
      >
        {deleteMeeting.isError ? <InlineNotice tone="error">{firstErrorMessage(deleteMeeting.error)}</InlineNotice> : null}
      </Modal>
    </div>
  );
}

function CreateMeetingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema) as Resolver<MeetingFormValues>,
    defaultValues: blankMeeting
  });
  const createMeeting = useMutation({
    mutationFn: (values: CreateMeetingInput) => api.createMeeting(values),
    onSuccess: async () => {
      form.reset(blankMeeting);
      onClose();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.meetings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reports })
      ]);
    }
  });

  function close() {
    if (createMeeting.isPending) return;
    createMeeting.reset();
    onClose();
  }

  return (
    <Modal
      description="Publish weekly Bible study details, venue, passage, and questions."
      onClose={close}
      open={open}
      title="Create meeting"
    >
      <form
        className="form-stack"
        noValidate
        onSubmit={form.handleSubmit((values) => createMeeting.mutate(values))}
      >
        <div className="form-grid">
          <Field error={form.formState.errors.title?.message} label="Title" {...form.register("title")} />
          <Field error={form.formState.errors.studyTopic?.message} label="Study Topic" {...form.register("studyTopic")} />
        </div>
        <div className="form-grid form-grid--three">
          <Field error={form.formState.errors.date?.message} label="Date" type="date" {...form.register("date")} />
          <Field error={form.formState.errors.startTime?.message} label="Start" type="time" {...form.register("startTime")} />
          <Field error={form.formState.errors.endTime?.message} label="End" type="time" {...form.register("endTime")} />
        </div>
        <div className="form-grid">
          <Field error={form.formState.errors.venueName?.message} label="Venue Name" {...form.register("venueName")} />
          <Field error={form.formState.errors.address?.message} label="Address" {...form.register("address")} />
        </div>
        <details className="form-details">
          <summary>Map coordinates (optional)</summary>
          <div className="form-grid">
            <Field
              error={form.formState.errors.latitude?.message}
              inputMode="decimal"
              label="Latitude"
              step="any"
              type="number"
              {...form.register("latitude")}
            />
            <Field
              error={form.formState.errors.longitude?.message}
              inputMode="decimal"
              label="Longitude"
              step="any"
              type="number"
              {...form.register("longitude")}
            />
          </div>
        </details>
        <div className="form-grid">
          <Field error={form.formState.errors.speakerName?.message} label="Speaker Name" {...form.register("speakerName")} />
          <Field
            error={form.formState.errors.worshipLeaderName?.message}
            label="Worship Leader Name"
            {...form.register("worshipLeaderName")}
          />
        </div>
        <div className="form-grid">
          <Field error={form.formState.errors.biblePassage?.message} label="Bible Passage" {...form.register("biblePassage")} />
          <SelectField error={form.formState.errors.status?.message} label="Status" {...form.register("status")}>
            {(["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"] as const).map((status) => (
              <option key={status} value={status}>{enumLabel(status)}</option>
            ))}
          </SelectField>
        </div>
        <TextAreaField
          error={form.formState.errors.description?.message}
          label="Description"
          rows={4}
          {...form.register("description")}
        />
        <TextAreaField
          error={form.formState.errors.discussionQuestions?.message}
          label="Discussion Questions"
          rows={5}
          {...form.register("discussionQuestions")}
        />
        {createMeeting.isError ? (
          <InlineNotice tone="error">{firstErrorMessage(createMeeting.error)}</InlineNotice>
        ) : null}
        <div className="form-actions form-actions--sticky">
          <Button disabled={createMeeting.isPending} onClick={close} variant="ghost">Cancel</Button>
          <Button loading={createMeeting.isPending} type="submit">
            <CalendarPlus aria-hidden="true" size={18} />
            Create meeting
          </Button>
        </div>
      </form>
    </Modal>
  );
}
