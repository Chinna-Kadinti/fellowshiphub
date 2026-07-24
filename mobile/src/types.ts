export type UserRole = "ADMIN" | "MEMBER";
export type MeetingStatus = "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED";
export type RsvpStatus = "ATTENDING" | "MAYBE" | "NOT_ATTENDING";
export type ArrivalStatus = "NOT_STARTED" | "ON_THE_WAY" | "REACHED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED";
export type VolunteerRole =
  | "SPEAKER"
  | "WORSHIP_LEADER"
  | "OPENING_PRAYER"
  | "CLOSING_PRAYER"
  | "HOSPITALITY"
  | "SETUP"
  | "REFRESHMENTS"
  | "PHOTOGRAPHY"
  | "CHILDREN_MINISTRY";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  area?: string | null;
  phoneVisible?: boolean;
  joinedAt?: string;
  groupId?: string | null;
}

export type MeetingMember = Pick<User, "id" | "name" | "email">;

export interface SessionPayload {
  user: User;
}

export interface AuthPayload extends SessionPayload {
  token: string;
}

export interface Rsvp {
  id: string;
  meetingId: string;
  userId: string;
  status: RsvpStatus;
  arrivalStatus: ArrivalStatus;
  updatedAt?: string;
  user?: Pick<User, "id" | "name" | "email">;
}

export interface Attendance {
  id: string;
  meetingId: string;
  userId: string;
  status: AttendanceStatus;
  checkInTime?: string | null;
  user?: Pick<User, "id" | "name">;
}

export interface VolunteerAssignment {
  id: string;
  meetingId: string;
  userId?: string | null;
  role: VolunteerRole;
  notes?: string | null;
  user?: Pick<User, "id" | "name"> | null;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  speakerName: string;
  worshipLeaderName: string;
  biblePassage: string;
  studyTopic: string;
  discussionQuestions: string;
  status: MeetingStatus;
  createdAt?: string;
  updatedAt?: string;
  rsvps?: Rsvp[];
  attendance?: Attendance[];
  volunteerAssignments?: VolunteerAssignment[];
  myRsvp?: Rsvp | RsvpStatus | null;
  myAttendance?: Attendance | null;
  rsvpSummary?: RsvpSummary & {
    totalResponses?: number;
    totalMembers?: number;
    percentages?: {
      attending: number;
      maybe: number;
      notAttending: number;
    };
  };
  attendanceSummary?: {
    recorded: number;
    present: number;
    absent: number;
    excused: number;
    percent?: number;
    presentPercent?: number;
    totalMembers?: number;
  };
  members?: MeetingMember[];
  rsvpRoster?: Rsvp[];
  attendanceRoster?: Array<{
    user: MeetingMember;
    attendance: Attendance | null;
  }>;
}

export interface RsvpSummary {
  attending: number;
  maybe: number;
  notAttending: number;
  noResponse: number;
}

export interface AnnouncementPreview {
  id: string;
  title: string;
  body: string;
  priority: "NORMAL" | "IMPORTANT" | "URGENT";
  pinned?: boolean;
  createdAt?: string;
  createdBy?: { name: string };
}

export interface Announcement extends AnnouncementPreview {
  pinned: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy: Pick<User, "id" | "name">;
}

export type ResourceType = "PDF" | "VIDEO" | "AUDIO" | "NOTES" | "LINK" | "PRESENTATION";

export interface StudyResource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  url?: string | null;
  bibleTopic: string;
  meetingId?: string | null;
  meeting?: Pick<Meeting, "id" | "title"> | null;
  createdAt?: string;
}

export type PrayerStatus = "ACTIVE" | "ANSWERED" | "ARCHIVED";
export type PrayerVisibility = "PUBLIC" | "PRIVATE";
export type PrayerCategory =
  | "HEALTH"
  | "FAMILY"
  | "EDUCATION"
  | "JOB"
  | "MINISTRY"
  | "THANKSGIVING"
  | "OTHER";

export interface PrayerRequest extends PrayerPreview {
  category: PrayerCategory;
  visibility: PrayerVisibility;
  status: PrayerStatus;
  createdById: string;
  createdAt: string;
  createdBy: Pick<User, "id" | "name">;
  interactionCount: number;
  prayed: boolean;
  hasPrayed?: boolean;
  canUpdate: boolean;
}

export interface DiscussionMessage {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: Pick<User, "id" | "name" | "role">;
  canDelete: boolean;
}

export interface DiscussionChannel {
  id: string;
  name: string;
  description?: string | null;
  messageCount?: number;
  messages?: DiscussionMessage[];
  _count?: { messages: number };
}

export interface ReadingPlan {
  id: string;
  date: string;
  passage: string;
  description: string;
  createdAt?: string;
  completed?: boolean;
  completionCount?: number;
}

export interface PrayerPreview {
  id: string;
  title: string;
  description: string;
  category?: string;
  status?: string;
  interactionCount?: number;
  interactions?: Array<{ id: string }>;
  createdBy?: { name: string };
}

export interface DailyVerse {
  id: string;
  text: string;
  reference: string;
}

export interface DashboardPayload {
  user?: User;
  memberCount: number;
  nextMeeting: Meeting | null;
  latestAnnouncement: AnnouncementPreview | null;
  prayerRequests: PrayerPreview[];
  upcomingMeetings: Meeting[];
  dailyVerse: DailyVerse | null;
  myRsvp?: RsvpStatus | null;
  rsvpSummary?: RsvpSummary;
}

export interface MeetingsPayload {
  meetings: Meeting[];
  memberCount: number;
}

export interface MeetingDetailPayload {
  meeting: Meeting;
  users: MeetingMember[];
  currentUser?: User;
  myRsvp?: Rsvp | null;
  myAttendance?: Attendance | null;
  rsvpSummary?: RsvpSummary;
  presentPercent?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
  phone?: string;
  area?: string;
  phoneVisible?: boolean;
}

export interface CreateMeetingInput {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  speakerName: string;
  worshipLeaderName: string;
  biblePassage: string;
  studyTopic: string;
  discussionQuestions: string;
  status: MeetingStatus;
}

export interface VolunteerInput {
  role: VolunteerRole;
  userId?: string;
  notes?: string;
}

export interface ApiErrorBody {
  error?: string | {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
  issues?: unknown;
}

export interface AnnouncementsPayload {
  announcements: Announcement[];
}

export interface ResourcesPayload {
  resources: StudyResource[];
  meetings?: Array<Pick<Meeting, "id" | "title">>;
  query?: string;
}

export interface PrayerPayload {
  requests: PrayerRequest[];
}

export interface DiscussionsPayload {
  channels: DiscussionChannel[];
  selectedChannel?: DiscussionChannel | null;
  messages?: DiscussionMessage[];
}

export interface ReadingPayload {
  plans: ReadingPlan[];
  completedCount: number;
  totalCount: number;
  progress: number;
  completionPercent?: number;
}

export interface DirectoryMember extends User {
  phoneHidden: boolean;
}

export interface DirectoryPayload {
  members: DirectoryMember[];
  profile: User;
  users?: User[];
  currentUser?: User;
}

export interface ReportsPayload {
  metrics: {
    prayerEngagement: number;
    readingCompletion: number;
    meetingsTracked: number;
  };
  attendanceChart: Array<{
    id: string;
    title: string;
    name: string;
    date: string;
    present: number;
    absent: number;
    excused: number;
  }>;
  rsvpSummary: {
    meeting: Pick<Meeting, "id" | "title" | "date">;
    data: Array<{ name: string; value: number }>;
  } | null;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    present: number;
    excused: number;
    attendancePercent: number;
    readingPercent: number;
  }>;
}
