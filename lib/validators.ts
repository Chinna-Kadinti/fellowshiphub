import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2),
  phone: z.string().optional(),
  area: z.string().optional(),
  phoneVisible: z.boolean().optional()
});

export const meetingSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  date: z.coerce.date(),
  startTime: z.string().min(4),
  endTime: z.string().min(4),
  venueName: z.string().min(2),
  address: z.string().min(3),
  latitude: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
  longitude: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
  speakerName: z.string().min(2),
  worshipLeaderName: z.string().min(2),
  biblePassage: z.string().min(2),
  studyTopic: z.string().min(2),
  discussionQuestions: z.string().min(5),
  status: z.enum(["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"])
});

export const announcementSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(5),
  priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]),
  pinned: z.coerce.boolean().optional()
});

export const resourceSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  type: z.enum(["PDF", "VIDEO", "AUDIO", "NOTES", "LINK", "PRESENTATION"]),
  url: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  bibleTopic: z.string().min(2),
  meetingId: z.string().optional().or(z.literal("").transform(() => undefined))
});

export const prayerSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  category: z.enum(["HEALTH", "FAMILY", "EDUCATION", "JOB", "MINISTRY", "THANKSGIVING", "OTHER"]),
  visibility: z.enum(["PUBLIC", "PRIVATE"])
});

export const messageSchema = z.object({
  channelId: z.string(),
  content: z.string().min(1).max(1000)
});

export const readingSchema = z.object({
  date: z.coerce.date(),
  passage: z.string().min(2),
  description: z.string().min(3)
});

export const volunteerSchema = z.object({
  meetingId: z.string(),
  userId: z.string().optional().or(z.literal("").transform(() => undefined)),
  role: z.enum([
    "SPEAKER",
    "WORSHIP_LEADER",
    "OPENING_PRAYER",
    "CLOSING_PRAYER",
    "HOSPITALITY",
    "SETUP",
    "REFRESHMENTS",
    "PHOTOGRAPHY",
    "CHILDREN_MINISTRY"
  ]),
  notes: z.string().optional()
});
