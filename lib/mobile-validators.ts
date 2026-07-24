import { z } from "zod";

const optionalText = z
  .string()
  .optional()
  .nullable()
  .transform((value) => {
    if (value === null || value === undefined || value === "") return undefined;
    return value;
  });

const optionalUrl = z
  .string()
  .url()
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === "https:" || protocol === "http:";
    } catch {
      return false;
    }
  }, "Use an http:// or https:// URL.")
  .optional()
  .nullable()
  .or(z.literal(""))
  .transform((value) => {
    if (value === null || value === undefined || value === "") return undefined;
    return value;
  });

export const mobileLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const mobileRegisterSchema = mobileLoginSchema.extend({
  name: z.string().min(2),
  phone: optionalText,
  area: optionalText,
  phoneVisible: z.boolean().optional()
});

export const mobileMeetingSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  date: z.coerce.date(),
  startTime: z.string().min(4),
  endTime: z.string().min(4),
  venueName: z.string().min(2),
  address: z.string().min(3),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  speakerName: z.string().min(2),
  worshipLeaderName: z.string().min(2),
  biblePassage: z.string().min(2),
  studyTopic: z.string().min(2),
  discussionQuestions: z.string().min(5),
  status: z.enum(["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"])
});

export const mobileRsvpSchema = z.object({
  status: z.enum(["ATTENDING", "MAYBE", "NOT_ATTENDING"])
});

export const mobileArrivalSchema = z.object({
  arrivalStatus: z.enum(["NOT_STARTED", "ON_THE_WAY", "REACHED"])
});

export const mobileAttendanceSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "EXCUSED"])
});

export const mobileVolunteerSchema = z.object({
  userId: optionalText,
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
  notes: optionalText
});

export const mobileAnnouncementSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(5),
  priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]),
  pinned: z.boolean().optional()
});

export const mobileResourceSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  type: z.enum(["PDF", "VIDEO", "AUDIO", "NOTES", "LINK", "PRESENTATION"]),
  url: optionalUrl,
  bibleTopic: z.string().min(2),
  meetingId: optionalText
});

export const mobilePrayerSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  category: z.enum(["HEALTH", "FAMILY", "EDUCATION", "JOB", "MINISTRY", "THANKSGIVING", "OTHER"]),
  visibility: z.enum(["PUBLIC", "PRIVATE"])
});

export const mobilePrayerStatusSchema = z.object({
  status: z.enum(["ACTIVE", "ANSWERED", "ARCHIVED"])
});

export const mobileMessageSchema = z.object({
  content: z.string().min(1).max(1000)
});

export const mobileReadingSchema = z.object({
  date: z.coerce.date(),
  passage: z.string().min(2),
  description: z.string().min(3)
});

export const mobileProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    phone: z.string().nullable().optional(),
    area: z.string().nullable().optional(),
    phoneVisible: z.boolean().optional()
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one profile field is required."
  });
