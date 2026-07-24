import { useQuery } from "@tanstack/react-query";
import { BarChart3, BookOpenCheck, CalendarCheck2, HandHeart } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { api, queryKeys } from "../../lib/api";
import { enumLabel } from "../../lib/format";
import type { AttendanceChartRow, ReportsPayload, RsvpChartRow } from "../_shared/models";
import {
  Badge,
  Card,
  CardHeading,
  EmptyState,
  ErrorState,
  FeatureHeader,
  FeaturePage,
  LoadingState,
  UnauthorizedState
} from "../_shared/FeatureUI";

const attendanceColors = {
  present: "#1f7369",
  absent: "#a33d66",
  excused: "#d89d35"
};

export function ReportsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const reportsQuery = useQuery({
    queryKey: queryKeys.reports,
    queryFn: api.reports,
    enabled: isAdmin
  });

  if (!isAdmin) {
    return (
      <FeaturePage>
        <FeatureHeader eyebrow="Reports and Analytics" title="Leader Dashboard" />
        <UnauthorizedState />
      </FeaturePage>
    );
  }

  const payload = reportsQuery.data as ReportsPayload | undefined;

  return (
    <FeaturePage>
      <FeatureHeader
        eyebrow="Reports and Analytics"
        title="Leader Dashboard"
        description="Attendance, engagement, and reading progress across the fellowship."
      />

      {reportsQuery.isPending ? (
        <LoadingState label="Preparing reports…" />
      ) : reportsQuery.isError ? (
        <ErrorState error={reportsQuery.error} retry={() => void reportsQuery.refetch()} />
      ) : payload ? (
        <>
          <section className="fhf-metric-grid" aria-label="Report summary">
            <Metric
              icon={<HandHeart aria-hidden="true" />}
              value={payload.metrics.prayerEngagement ?? payload.metrics.prayerCount ?? 0}
              title="Prayer Engagement"
              helper="I prayed interactions"
            />
            <Metric
              icon={<BookOpenCheck aria-hidden="true" />}
              value={`${payload.metrics.readingCompletion ?? payload.metrics.readingCompletionRate ?? 0}%`}
              title="Reading Completion"
              helper="group-wide progress"
            />
            <Metric
              icon={<CalendarCheck2 aria-hidden="true" />}
              value={payload.metrics.meetingsTracked ?? payload.metrics.meetingCount ?? 0}
              title="Meetings Tracked"
              helper="all statuses"
            />
          </section>

          <section className="fhf-report-grid">
            <Card>
              <CardHeading
                title="Meeting Attendance"
                subtitle="Present, absent, and excused counts for the latest meetings."
              />
              <div className="fhf-divider" />
              {payload.attendanceChart.length > 0 ? (
                <AttendanceChart data={payload.attendanceChart} />
              ) : (
                <EmptyState
                  icon={<BarChart3 aria-hidden="true" />}
                  title="No attendance data"
                  description="Attendance appears after meetings are tracked."
                />
              )}
            </Card>

            <Card>
              <CardHeading
                title="RSVP Summary"
                subtitle={payload.rsvpSummary?.meeting?.title ?? payload.rsvpSummary?.meetingTitle ?? "Latest meeting"}
              />
              <div className="fhf-divider" />
              {payload.rsvpSummary && rsvpRows(payload.rsvpSummary).length > 0 ? (
                <RsvpDonut data={rsvpRows(payload.rsvpSummary)} />
              ) : (
                <EmptyState
                  title="No RSVP data"
                  description="The latest meeting’s response summary will appear here."
                />
              )}
            </Card>
          </section>

          <Card>
            <CardHeading
              title="Member Attendance Percentage"
              subtitle="Swipe the table horizontally to view every metric."
            />
            <div className="fhf-divider" />
            {payload.members.length > 0 ? (
              <div className="fhf-table-wrap">
                <table className="fhf-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Role</th>
                      <th>Present</th>
                      <th>Excused</th>
                      <th>Attendance</th>
                      <th>Reading</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.members.map((member) => (
                      <tr key={member.id}>
                        <td><strong>{member.name}</strong></td>
                        <td><Badge tone={member.role === "ADMIN" ? "primary" : "neutral"}>{enumLabel(member.role)}</Badge></td>
                        <td>{member.present}</td>
                        <td>{member.excused}</td>
                        <td>{member.attendancePercent ?? member.attendance ?? 0}%</td>
                        <td>{member.readingPercent ?? member.reading ?? 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No member data" description="Member report rows will appear here." />
            )}
          </Card>
        </>
      ) : null}
    </FeaturePage>
  );
}

function Metric({
  icon,
  value,
  title,
  helper
}: {
  icon: ReactNode;
  value: string | number;
  title: string;
  helper: string;
}) {
  return (
    <Card className="fhf-metric">
      <div className="fhf-metric-icon">{icon}</div>
      <strong>{value}</strong>
      <span>{title}</span>
      <small>{helper}</small>
    </Card>
  );
}

function AttendanceChart({ data }: { data: AttendanceChartRow[] }) {
  const rows = data.slice(-8);
  const width = Math.max(420, rows.length * 64);
  const height = 238;
  const chartTop = 16;
  const chartBottom = 188;
  const chartHeight = chartBottom - chartTop;
  const max = Math.max(...rows.map((row) => row.present + row.absent + row.excused), 1);
  const plotWidth = width - 48;
  const groupWidth = plotWidth / rows.length;
  const barWidth = Math.min(28, groupWidth * 0.55);

  return (
    <div>
      <div className="fhf-chart-legend" aria-hidden="true">
        <span><i style={{ background: attendanceColors.present }} />Present</span>
        <span><i style={{ background: attendanceColors.absent }} />Absent</span>
        <span><i style={{ background: attendanceColors.excused }} />Excused</span>
      </div>
      <div className="fhf-chart-scroll">
        <svg
          className="fhf-bar-chart"
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={`Attendance for ${rows.length} meetings`}
        >
          {[0, 0.5, 1].map((ratio) => {
            const y = chartBottom - chartHeight * ratio;
            return (
              <g key={ratio}>
                <line x1="36" x2={width - 8} y1={y} y2={y} stroke="#e3ddd2" strokeDasharray="3 4" />
                <text x="30" y={y + 4} textAnchor="end">{Math.round(max * ratio)}</text>
              </g>
            );
          })}
          {rows.map((row, index) => {
            const x = 38 + groupWidth * index + (groupWidth - barWidth) / 2;
            const presentHeight = (row.present / max) * chartHeight;
            const absentHeight = (row.absent / max) * chartHeight;
            const excusedHeight = (row.excused / max) * chartHeight;
            const label = row.name.length > 10 ? `${row.name.slice(0, 9)}…` : row.name;
            return (
              <g key={row.meetingId ?? `${row.name}-${index}`}>
                <title>{`${row.name}: ${row.present} present, ${row.absent} absent, ${row.excused} excused`}</title>
                <rect
                  x={x}
                  y={chartBottom - presentHeight}
                  width={barWidth}
                  height={presentHeight}
                  rx="3"
                  fill={attendanceColors.present}
                />
                <rect
                  x={x}
                  y={chartBottom - presentHeight - absentHeight}
                  width={barWidth}
                  height={absentHeight}
                  fill={attendanceColors.absent}
                />
                <rect
                  x={x}
                  y={chartBottom - presentHeight - absentHeight - excusedHeight}
                  width={barWidth}
                  height={excusedHeight}
                  rx="3"
                  fill={attendanceColors.excused}
                />
                <text x={x + barWidth / 2} y={chartBottom + 18} textAnchor="middle">{label}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function RsvpDonut({ data }: { data: RsvpChartRow[] }) {
  const palette = ["#1f7369", "#d89d35", "#a33d66"];
  const total = data.reduce((sum, row) => sum + row.value, 0);
  let cursor = 0;
  const stops = data.map((row, index) => {
    const start = cursor;
    cursor += total > 0 ? (row.value / total) * 100 : 0;
    return `${palette[index % palette.length]} ${start}% ${cursor}%`;
  });

  return (
    <div className="fhf-donut-layout">
      <div
        className="fhf-donut"
        style={{ background: `conic-gradient(${stops.join(",")})` }}
        role="img"
        aria-label={data.map((row) => `${row.name}: ${row.value}`).join(", ")}
      >
        <span><strong>{total}</strong><small>responses</small></span>
      </div>
      <ul className="fhf-donut-legend">
        {data.map((row, index) => (
          <li key={row.name}>
            <i style={{ background: palette[index % palette.length] }} aria-hidden="true" />
            <span>{row.name}</span>
            <strong>{row.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function rsvpRows(summary: NonNullable<ReportsPayload["rsvpSummary"]>): RsvpChartRow[] {
  if (summary.data) return summary.data;
  return [
    { name: "Attending", value: summary.attending ?? 0 },
    { name: "Maybe", value: summary.maybe ?? 0 },
    { name: "Not attending", value: summary.notAttending ?? 0 }
  ];
}
