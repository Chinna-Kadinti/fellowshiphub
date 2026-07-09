CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE "MeetingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "RSVPStatus" AS ENUM ('ATTENDING', 'MAYBE', 'NOT_ATTENDING');
CREATE TYPE "ArrivalStatus" AS ENUM ('NOT_STARTED', 'ON_THE_WAY', 'REACHED');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED');
CREATE TYPE "AnnouncementPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');
CREATE TYPE "ResourceType" AS ENUM ('PDF', 'VIDEO', 'AUDIO', 'NOTES', 'LINK', 'PRESENTATION');
CREATE TYPE "PrayerCategory" AS ENUM ('HEALTH', 'FAMILY', 'EDUCATION', 'JOB', 'MINISTRY', 'THANKSGIVING', 'OTHER');
CREATE TYPE "PrayerVisibility" AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE "PrayerStatus" AS ENUM ('ACTIVE', 'ANSWERED', 'ARCHIVED');
CREATE TYPE "VolunteerRole" AS ENUM ('SPEAKER', 'WORSHIP_LEADER', 'OPENING_PRAYER', 'CLOSING_PRAYER', 'HOSPITALITY', 'SETUP', 'REFRESHMENTS', 'PHOTOGRAPHY', 'CHILDREN_MINISTRY');

CREATE TABLE "Group" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
  "phone" TEXT,
  "area" TEXT,
  "phoneVisible" BOOLEAN NOT NULL DEFAULT false,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "groupId" TEXT,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Meeting" (
  "id" TEXT NOT NULL,
  "groupId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "venueName" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "speakerName" TEXT NOT NULL,
  "worshipLeaderName" TEXT NOT NULL,
  "biblePassage" TEXT NOT NULL,
  "studyTopic" TEXT NOT NULL,
  "discussionQuestions" TEXT NOT NULL,
  "status" "MeetingStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RSVP" (
  "id" TEXT NOT NULL,
  "meetingId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "RSVPStatus" NOT NULL,
  "arrivalStatus" "ArrivalStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RSVP_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Attendance" (
  "id" TEXT NOT NULL,
  "meetingId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
  "checkInTime" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Announcement" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudyResource" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "type" "ResourceType" NOT NULL,
  "url" TEXT,
  "bibleTopic" TEXT NOT NULL,
  "meetingId" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudyResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PrayerRequest" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" "PrayerCategory" NOT NULL,
  "visibility" "PrayerVisibility" NOT NULL DEFAULT 'PUBLIC',
  "status" "PrayerStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PrayerRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PrayerInteraction" (
  "id" TEXT NOT NULL,
  "prayerRequestId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrayerInteraction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscussionChannel" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiscussionChannel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DiscussionMessage" (
  "id" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DiscussionMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BibleReadingPlan" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "passage" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BibleReadingPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BibleReadingCompletion" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BibleReadingCompletion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyVerse" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DailyVerse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VolunteerAssignment" (
  "id" TEXT NOT NULL,
  "meetingId" TEXT NOT NULL,
  "userId" TEXT,
  "role" "VolunteerRole" NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VolunteerAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "RSVP_meetingId_userId_key" ON "RSVP"("meetingId", "userId");
CREATE UNIQUE INDEX "Attendance_meetingId_userId_key" ON "Attendance"("meetingId", "userId");
CREATE UNIQUE INDEX "PrayerInteraction_prayerRequestId_userId_key" ON "PrayerInteraction"("prayerRequestId", "userId");
CREATE UNIQUE INDEX "DiscussionChannel_name_key" ON "DiscussionChannel"("name");
CREATE UNIQUE INDEX "BibleReadingCompletion_planId_userId_key" ON "BibleReadingCompletion"("planId", "userId");
CREATE UNIQUE INDEX "VolunteerAssignment_meetingId_role_key" ON "VolunteerAssignment"("meetingId", "role");

ALTER TABLE "User" ADD CONSTRAINT "User_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyResource" ADD CONSTRAINT "StudyResource_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudyResource" ADD CONSTRAINT "StudyResource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrayerRequest" ADD CONSTRAINT "PrayerRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrayerInteraction" ADD CONSTRAINT "PrayerInteraction_prayerRequestId_fkey" FOREIGN KEY ("prayerRequestId") REFERENCES "PrayerRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrayerInteraction" ADD CONSTRAINT "PrayerInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscussionMessage" ADD CONSTRAINT "DiscussionMessage_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "DiscussionChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscussionMessage" ADD CONSTRAINT "DiscussionMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BibleReadingCompletion" ADD CONSTRAINT "BibleReadingCompletion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BibleReadingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BibleReadingCompletion" ADD CONSTRAINT "BibleReadingCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VolunteerAssignment" ADD CONSTRAINT "VolunteerAssignment_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VolunteerAssignment" ADD CONSTRAINT "VolunteerAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
