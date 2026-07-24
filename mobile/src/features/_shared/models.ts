import type { User, UserRole } from "../../types";

export type AnnouncementPriority = "NORMAL" | "IMPORTANT" | "URGENT";
export type ResourceType = "PDF" | "VIDEO" | "AUDIO" | "NOTES" | "LINK" | "PRESENTATION";
export type PrayerCategory =
  | "HEALTH"
  | "FAMILY"
  | "EDUCATION"
  | "JOB"
  | "MINISTRY"
  | "THANKSGIVING"
  | "OTHER";
export type PrayerVisibility = "PUBLIC" | "PRIVATE";
export type PrayerStatus = "ACTIVE" | "ANSWERED" | "ARCHIVED";

export interface PersonSummary {
  id?: string;
  name: string;
  role?: UserRole;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  pinned: boolean;
  createdAt: string;
  createdBy: PersonSummary;
}

export interface AnnouncementsPayload {
  announcements: Announcement[];
}

export interface MeetingOption {
  id: string;
  title: string;
  date?: string;
}

export interface StudyResource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  url: string | null;
  bibleTopic: string;
  meetingId?: string | null;
  meeting: MeetingOption | null;
  createdAt?: string;
  createdBy?: PersonSummary;
}

export interface ResourcesPayload {
  resources: StudyResource[];
  meetings: MeetingOption[];
  query: string;
}

export interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  category: PrayerCategory;
  visibility: PrayerVisibility;
  status: PrayerStatus;
  createdById: string;
  createdAt: string;
  createdBy: PersonSummary;
  interactionCount: number;
  prayed: boolean;
  canUpdate: boolean;
}

export interface PrayerPayload {
  requests: PrayerRequest[];
}

export interface DiscussionChannel {
  id: string;
  name: string;
  description: string | null;
  messageCount?: number;
  _count?: { messages: number };
}

export interface DiscussionMessage {
  id: string;
  channelId?: string;
  content: string;
  createdAt: string;
  author: PersonSummary;
  canDelete?: boolean;
}

export interface DiscussionsPayload {
  channels: DiscussionChannel[];
  selectedChannel: DiscussionChannel | null;
  messages: DiscussionMessage[];
}

export interface ReadingPlan {
  id: string;
  date: string;
  passage: string;
  description: string;
  completed: boolean;
  completionCount?: number;
}

export interface ReadingPayload {
  plans: ReadingPlan[];
  completedCount: number;
  totalCount: number;
  progress: number;
}

export interface DirectoryMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  phoneHidden?: boolean;
  phoneVisible?: boolean;
  area: string | null;
  joinedAt: string;
}

export interface DirectoryPayload {
  members: DirectoryMember[];
  profile: User;
}

export interface ReportMetricPayload {
  prayerEngagement?: number;
  prayerCount?: number;
  readingCompletion?: number;
  readingCompletionRate?: number;
  meetingsTracked?: number;
  meetingCount?: number;
}

export interface AttendanceChartRow {
  meetingId?: string;
  name: string;
  present: number;
  absent: number;
  excused: number;
}

export interface RsvpChartRow {
  name: string;
  value: number;
}

export interface RsvpSummaryPayload {
  meetingTitle?: string | null;
  title?: string | null;
  meeting?: { id: string; title: string; date: string } | null;
  data?: RsvpChartRow[];
  attending?: number;
  maybe?: number;
  notAttending?: number;
}

export interface ReportMember {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  present: number;
  excused: number;
  attendance?: number;
  attendancePercent?: number;
  reading?: number;
  readingPercent?: number;
}

export interface ReportsPayload {
  metrics: ReportMetricPayload;
  attendanceChart: AttendanceChartRow[];
  rsvpSummary: RsvpSummaryPayload | null;
  members: ReportMember[];
}
