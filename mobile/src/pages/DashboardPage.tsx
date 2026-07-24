import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircleHeart,
  Sparkles,
  UserRound
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingScreen,
  Metric,
  ScreenHeader
} from "../components/ui";
import { api, queryKeys } from "../lib/api";
import {
  calendarDateTile,
  enumLabel,
  formatCalendarDate,
  meetingCountdown,
  percent,
  summarizeRsvps
} from "../lib/format";
import type { RsvpStatus } from "../types";

export function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dashboard = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: api.dashboard
  });
  const rsvp = useMutation({
    mutationFn: ({ meetingId, status }: { meetingId: string; status: RsvpStatus }) =>
      api.updateRsvp(meetingId, status),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.meetings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.meeting(variables.meetingId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reports })
      ]);
    }
  });

  if (dashboard.isPending) return <LoadingScreen label="Preparing your dashboard…" />;
  if (dashboard.isError) {
    return <ErrorState error={dashboard.error} onRetry={() => void dashboard.refetch()} />;
  }

  const data = dashboard.data;
  const nextMeeting = data.nextMeeting;
  const memberCount = data.memberCount ?? 0;
  const summary =
    data.rsvpSummary ??
    nextMeeting?.rsvpSummary ??
    summarizeRsvps(nextMeeting?.rsvps, memberCount);
  const myRsvp =
    data.myRsvp ??
    (typeof nextMeeting?.myRsvp === "string"
      ? nextMeeting.myRsvp
      : nextMeeting?.myRsvp?.status) ??
    nextMeeting?.rsvps?.find((item) => item.userId === user?.id)?.status ??
    null;

  return (
    <div className="page-stack">
      <ScreenHeader
        action={<Badge tone="gold">{enumLabel(user?.role)}</Badge>}
        eyebrow="Welcome back"
        title={user?.name ?? "Friend"}
      />

      <div className="dashboard-grid">
        {nextMeeting ? (
          <Card className="meeting-hero">
            <div className="meeting-hero__art">
              <Sparkles aria-hidden="true" size={29} />
            </div>
            <div className="card__header meeting-hero__header">
              <div>
                <Badge tone="primary">{meetingCountdown(nextMeeting)}</Badge>
                <h2>{nextMeeting.title}</h2>
                <p>{nextMeeting.studyTopic}</p>
              </div>
              <Link aria-label={`View ${nextMeeting.title}`} className="icon-link" to={`/meetings/${nextMeeting.id}`}>
                <ArrowRight aria-hidden="true" size={21} />
              </Link>
            </div>
            <div className="meeting-facts">
              <span><CalendarDays aria-hidden="true" size={17} />{formatCalendarDate(nextMeeting.date)}</span>
              <span><Clock3 aria-hidden="true" size={17} />{nextMeeting.startTime} – {nextMeeting.endTime}</span>
              <span><MapPin aria-hidden="true" size={17} />{nextMeeting.venueName}</span>
              <span><UserRound aria-hidden="true" size={17} />{nextMeeting.speakerName}</span>
            </div>
            <div className="passage-callout">
              <small>Passage</small>
              <strong>{nextMeeting.biblePassage}</strong>
            </div>
            <div>
              <p className="section-label">Will you be there?</p>
              <div className="segmented-actions">
                {([
                  ["ATTENDING", "Attending"],
                  ["MAYBE", "Maybe"],
                  ["NOT_ATTENDING", "Can't go"]
                ] as const).map(([status, label]) => (
                  <Button
                    aria-pressed={myRsvp === status}
                    disabled={rsvp.isPending}
                    key={status}
                    onClick={() => rsvp.mutate({ meetingId: nextMeeting.id, status })}
                    size="sm"
                    variant={myRsvp === status ? "primary" : "outline"}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {rsvp.isError ? <p className="inline-error">{rsvp.error.message}</p> : null}
            </div>
            <div className="metrics-grid metrics-grid--four">
              <Metric helper={`${percent(summary.attending, memberCount)}%`} label="Attending" value={summary.attending} />
              <Metric helper={`${percent(summary.maybe, memberCount)}%`} label="Maybe" value={summary.maybe} />
              <Metric helper={`${percent(summary.notAttending, memberCount)}%`} label="Not going" value={summary.notAttending} />
              <Metric helper="members" label="No response" value={summary.noResponse} />
            </div>
          </Card>
        ) : (
          <EmptyState
            body="Leaders can publish the next Bible study from Meeting Management."
            title="No upcoming published meeting"
          />
        )}

        <div className="dashboard-side">
          <Card className="verse-card">
            <div className="card__header card__header--row">
              <div>
                <p className="eyebrow">A word for today</p>
                <h2>Today’s Verse</h2>
              </div>
              <BookMark />
            </div>
            {data.dailyVerse ? (
              <blockquote>
                “{data.dailyVerse.text}”
                <cite>{data.dailyVerse.reference}</cite>
              </blockquote>
            ) : (
              <p className="muted-copy">Seed daily verses to show a verse here.</p>
            )}
          </Card>

          <Card>
            <div className="card__header">
              <p className="eyebrow">Stay informed</p>
              <h2>Latest Announcement</h2>
            </div>
            {data.latestAnnouncement ? (
              <div className="announcement-preview">
                <Badge tone={data.latestAnnouncement.priority === "URGENT" ? "danger" : "gold"}>
                  {enumLabel(data.latestAnnouncement.priority)}
                </Badge>
                <h3>{data.latestAnnouncement.title}</h3>
                <p>{data.latestAnnouncement.body}</p>
                {data.latestAnnouncement.createdBy?.name ? (
                  <small>By {data.latestAnnouncement.createdBy.name}</small>
                ) : null}
              </div>
            ) : (
              <p className="muted-copy">No announcements yet.</p>
            )}
          </Card>
        </div>
      </div>

      <div className="content-grid">
        <Card>
          <div className="card__header card__header--row">
            <h2>Recent Prayer Requests</h2>
            <Link className="text-link" to="/prayer">View all</Link>
          </div>
          <div className="compact-list">
            {data.prayerRequests.map((request) => (
              <Link className="compact-list__row" key={request.id} to="/prayer">
                <span className="list-icon list-icon--rose"><MessageCircleHeart aria-hidden="true" size={19} /></span>
                <span className="compact-list__copy">
                  <strong>{request.title}</strong>
                  <small>{request.description}</small>
                </span>
                <span className="interaction-count">
                  {request.interactionCount ?? request.interactions?.length ?? 0}
                </span>
              </Link>
            ))}
            {data.prayerRequests.length === 0 ? <p className="muted-copy">No prayer requests visible yet.</p> : null}
          </div>
        </Card>

        <Card>
          <div className="card__header card__header--row">
            <h2>Upcoming Events</h2>
            <Link className="text-link" to="/meetings">View all</Link>
          </div>
          <div className="compact-list">
            {data.upcomingMeetings.map((meeting) => {
              const tile = calendarDateTile(meeting.date);
              return (
                <Link className="compact-list__row" key={meeting.id} to={`/meetings/${meeting.id}`}>
                  <span className="date-tile">
                    <strong>{tile.day}</strong>
                    <small>{tile.month}</small>
                  </span>
                  <span className="compact-list__copy">
                    <strong>{meeting.title}</strong>
                    <small>{meeting.startTime} · {meeting.venueName}</small>
                  </span>
                  <CheckCircle2 aria-hidden="true" className="primary-icon" size={20} />
                </Link>
              );
            })}
            {data.upcomingMeetings.length === 0 ? <p className="muted-copy">No upcoming events.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

function BookMark() {
  return (
    <span aria-hidden="true" className="verse-card__icon">
      <Sparkles size={21} />
    </span>
  );
}
