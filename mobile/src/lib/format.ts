import type { Meeting, Rsvp, RsvpSummary } from "../types";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric"
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short"
});

function parseCalendarDate(value: string | Date) {
  if (typeof value === "string") {
    const calendarParts = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (calendarParts) {
      return new Date(
        Number(calendarParts[1]),
        Number(calendarParts[2]) - 1,
        Number(calendarParts[3])
      );
    }
  }

  return new Date(value);
}

export function enumLabel(value?: string | null) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : dateFormatter.format(date);
}

export function formatCalendarDate(value?: string | Date | null) {
  if (!value) return "";
  const date = parseCalendarDate(value);
  return Number.isNaN(date.getTime()) ? String(value) : dateFormatter.format(date);
}

export function calendarDateTile(value: string | Date) {
  const date = parseCalendarDate(value);
  if (Number.isNaN(date.getTime())) {
    return { day: "", month: "" };
  }
  return {
    day: String(date.getDate()),
    month: monthFormatter.format(date)
  };
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : dateTimeFormatter.format(date);
}

export function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export function meetingDateTime(meeting: Pick<Meeting, "date" | "startTime">) {
  const date = parseCalendarDate(meeting.date);
  const [hours, minutes] = meeting.startTime.split(":").map(Number);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

export function meetingCountdown(meeting: Pick<Meeting, "date" | "startTime">) {
  const milliseconds = meetingDateTime(meeting).getTime() - Date.now();
  if (milliseconds <= 0) return "Meeting time has started";

  const minutes = Math.max(1, Math.round(milliseconds / 60_000));
  if (minutes < 60) return `Starts in ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Starts in ${hours} hr`;

  const days = Math.round(hours / 24);
  return `Starts in ${days} day${days === 1 ? "" : "s"}`;
}

export function summarizeRsvps(rsvps: Rsvp[] = [], memberCount = 0): RsvpSummary {
  const attending = rsvps.filter((rsvp) => rsvp.status === "ATTENDING").length;
  const maybe = rsvps.filter((rsvp) => rsvp.status === "MAYBE").length;
  const notAttending = rsvps.filter((rsvp) => rsvp.status === "NOT_ATTENDING").length;

  return {
    attending,
    maybe,
    notAttending,
    noResponse: Math.max(memberCount - rsvps.length, 0)
  };
}

export function googleMapsUrl(address: string, latitude?: number | null, longitude?: number | null) {
  const query =
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined
      ? `${latitude},${longitude}`
      : address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function firstErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
