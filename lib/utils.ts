import { type ClassValue, clsx } from "clsx";
import { format, formatDistanceToNowStrict, isFuture } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return format(date, "EEE, MMM d, yyyy");
}

export function formatDateTime(date: Date) {
  return format(date, "MMM d, yyyy h:mm a");
}

export function meetingStatusText(date: Date, startTime: string) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const meetingDate = new Date(date);
  meetingDate.setHours(hours || 0, minutes || 0, 0, 0);

  if (isFuture(meetingDate)) {
    return `Starts in ${formatDistanceToNowStrict(meetingDate)}`;
  }

  return "Meeting time has started";
}

export function enumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function googleMapsUrl(address: string, latitude?: number | null, longitude?: number | null) {
  const query = latitude && longitude ? `${latitude},${longitude}` : address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function percent(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}
