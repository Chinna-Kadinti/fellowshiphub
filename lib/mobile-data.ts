import type { z } from "zod";
import { MobileApiError, type MobileUser } from "@/lib/mobile-api";
import { prisma } from "@/lib/prisma";
import { percent } from "@/lib/utils";
import {
  mobileAnnouncementSchema,
  mobileArrivalSchema,
  mobileAttendanceSchema,
  mobileMeetingSchema,
  mobileMessageSchema,
  mobilePrayerSchema,
  mobilePrayerStatusSchema,
  mobileProfileSchema,
  mobileReadingSchema,
  mobileResourceSchema,
  mobileRsvpSchema,
  mobileVolunteerSchema
} from "@/lib/mobile-validators";

type MeetingInput = z.infer<typeof mobileMeetingSchema>;
type RsvpInput = z.infer<typeof mobileRsvpSchema>;
type ArrivalInput = z.infer<typeof mobileArrivalSchema>;
type AttendanceInput = z.infer<typeof mobileAttendanceSchema>;
type VolunteerInput = z.infer<typeof mobileVolunteerSchema>;
type AnnouncementInput = z.infer<typeof mobileAnnouncementSchema>;
type ResourceInput = z.infer<typeof mobileResourceSchema>;
type PrayerInput = z.infer<typeof mobilePrayerSchema>;
type PrayerStatusInput = z.infer<typeof mobilePrayerStatusSchema>;
type MessageInput = z.infer<typeof mobileMessageSchema>;
type ReadingInput = z.infer<typeof mobileReadingSchema>;
type ProfileInput = z.infer<typeof mobileProfileSchema>;

async function requireMeetingRecord(meetingId: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { id: true }
  });
  if (!meeting) {
    throw new MobileApiError(404, "MEETING_NOT_FOUND", "The meeting was not found.");
  }
}

export async function getMobileDashboard(user: MobileUser) {
  const now = new Date();
  const [memberCount, nextMeeting, latestAnnouncement, prayerRequests, upcomingMeetings, verseCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.meeting.findFirst({
        where: { date: { gte: now }, status: "PUBLISHED" },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
        include: { rsvps: true }
      }),
      prisma.announcement.findFirst({
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        include: { createdBy: { select: { name: true } } }
      }),
      prisma.prayerRequest.findMany({
        where:
          user.role === "ADMIN"
            ? {}
            : { OR: [{ visibility: "PUBLIC" }, { createdById: user.id }] },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          createdBy: { select: { name: true } },
          interactions: { select: { userId: true } }
        }
      }),
      prisma.meeting.findMany({
        where: { date: { gte: now }, status: { in: ["PUBLISHED", "DRAFT"] } },
        orderBy: { date: "asc" },
        take: 4
      }),
      prisma.dailyVerse.count()
    ]);

  const dailyVerse =
    verseCount > 0
      ? await prisma.dailyVerse.findFirst({
          skip: Math.floor(now.getTime() / 86_400_000) % verseCount,
          orderBy: { id: "asc" }
        })
      : null;

  let nextMeetingData = null;
  if (nextMeeting) {
    const { rsvps, ...meeting } = nextMeeting;
    const attending = rsvps.filter((rsvp) => rsvp.status === "ATTENDING").length;
    const maybe = rsvps.filter((rsvp) => rsvp.status === "MAYBE").length;
    const notAttending = rsvps.filter((rsvp) => rsvp.status === "NOT_ATTENDING").length;
    nextMeetingData = {
      ...meeting,
      myRsvp: rsvps.find((rsvp) => rsvp.userId === user.id)?.status ?? null,
      rsvpSummary: {
        attending,
        maybe,
        notAttending,
        noResponse: Math.max(memberCount - rsvps.length, 0),
        totalResponses: rsvps.length,
        totalMembers: memberCount,
        percentages: {
          attending: percent(attending, memberCount),
          maybe: percent(maybe, memberCount),
          notAttending: percent(notAttending, memberCount)
        }
      }
    };
  }

  return {
    user,
    memberCount,
    nextMeeting: nextMeetingData,
    dailyVerse,
    latestAnnouncement,
    prayerRequests: prayerRequests.map(({ interactions, ...request }) => ({
      ...request,
      interactionCount: interactions.length,
      prayed: interactions.some((interaction) => interaction.userId === user.id)
    })),
    upcomingMeetings
  };
}

export async function listMobileMeetings(user: MobileUser) {
  const [meetings, memberCount] = await Promise.all([
    prisma.meeting.findMany({
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
      include: {
        rsvps: true,
        attendance: true
      }
    }),
    prisma.user.count()
  ]);

  return {
    memberCount,
    meetings: meetings.map(({ rsvps, attendance, ...meeting }) => {
      const attending = rsvps.filter((rsvp) => rsvp.status === "ATTENDING").length;
      const present = attendance.filter((row) => row.status === "PRESENT").length;
      return {
        ...meeting,
        myRsvp: rsvps.find((rsvp) => rsvp.userId === user.id) ?? null,
        myAttendance: attendance.find((row) => row.userId === user.id) ?? null,
        rsvpSummary: {
          attending,
          maybe: rsvps.filter((rsvp) => rsvp.status === "MAYBE").length,
          notAttending: rsvps.filter((rsvp) => rsvp.status === "NOT_ATTENDING").length,
          noResponse: Math.max(memberCount - rsvps.length, 0),
          totalResponses: rsvps.length
        },
        attendanceSummary: {
          recorded: attendance.length,
          present,
          absent: attendance.filter((row) => row.status === "ABSENT").length,
          excused: attendance.filter((row) => row.status === "EXCUSED").length,
          percent: percent(attendance.length, memberCount)
        }
      };
    })
  };
}

export async function getMobileMeeting(user: MobileUser, meetingId: string) {
  const [meeting, users] = await Promise.all([
    prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        rsvps: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { updatedAt: "desc" }
        },
        attendance: {
          include: { user: { select: { id: true, name: true } } }
        },
        resources: true,
        volunteerAssignments: {
          include: { user: { select: { id: true, name: true } } }
        }
      }
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true }
    })
  ]);

  if (!meeting) {
    throw new MobileApiError(404, "MEETING_NOT_FOUND", "The meeting was not found.");
  }

  const { rsvps, attendance, resources, volunteerAssignments, ...details } = meeting;
  const attending = rsvps.filter((rsvp) => rsvp.status === "ATTENDING").length;
  const present = attendance.filter((row) => row.status === "PRESENT").length;
  const adminData =
    user.role === "ADMIN"
      ? {
          members: users,
          rsvpRoster: rsvps,
          attendanceRoster: users.map((member) => ({
            user: member,
            attendance: attendance.find((row) => row.userId === member.id) ?? null
          }))
        }
      : {};

  return {
    meeting: {
      ...details,
      resources,
      volunteerAssignments,
      myRsvp: rsvps.find((rsvp) => rsvp.userId === user.id) ?? null,
      myAttendance: attendance.find((row) => row.userId === user.id) ?? null,
      rsvpSummary: {
        attending,
        maybe: rsvps.filter((rsvp) => rsvp.status === "MAYBE").length,
        notAttending: rsvps.filter((rsvp) => rsvp.status === "NOT_ATTENDING").length,
        noResponse: Math.max(users.length - rsvps.length, 0),
        totalResponses: rsvps.length,
        totalMembers: users.length
      },
      attendanceSummary: {
        present,
        absent: attendance.filter((row) => row.status === "ABSENT").length,
        excused: attendance.filter((row) => row.status === "EXCUSED").length,
        recorded: attendance.length,
        totalMembers: users.length,
        presentPercent: percent(present, users.length)
      },
      ...adminData
    }
  };
}

export async function createMobileMeeting(input: MeetingInput) {
  const group = await prisma.group.findFirst({ orderBy: { createdAt: "asc" } });
  return prisma.meeting.create({
    data: {
      ...input,
      latitude: input.latitude,
      longitude: input.longitude,
      groupId: group?.id
    }
  });
}

export async function deleteMobileMeeting(meetingId: string) {
  await requireMeetingRecord(meetingId);
  await prisma.meeting.delete({ where: { id: meetingId } });
  return { deleted: true as const, id: meetingId };
}

export async function updateMobileRsvp(user: MobileUser, meetingId: string, input: RsvpInput) {
  await requireMeetingRecord(meetingId);
  return prisma.rSVP.upsert({
    where: { meetingId_userId: { meetingId, userId: user.id } },
    update: { status: input.status },
    create: { meetingId, userId: user.id, status: input.status }
  });
}

export async function updateMobileArrival(user: MobileUser, meetingId: string, input: ArrivalInput) {
  await requireMeetingRecord(meetingId);
  return prisma.rSVP.upsert({
    where: { meetingId_userId: { meetingId, userId: user.id } },
    update: { arrivalStatus: input.arrivalStatus },
    create: {
      meetingId,
      userId: user.id,
      status: "ATTENDING",
      arrivalStatus: input.arrivalStatus
    }
  });
}

export async function mobileCheckIn(user: MobileUser, meetingId: string) {
  await requireMeetingRecord(meetingId);
  const now = new Date();
  return prisma.attendance.upsert({
    where: { meetingId_userId: { meetingId, userId: user.id } },
    update: { status: "PRESENT", checkInTime: now },
    create: { meetingId, userId: user.id, status: "PRESENT", checkInTime: now }
  });
}

export async function markMobileAttendance(meetingId: string, input: AttendanceInput) {
  await requireMeetingRecord(meetingId);
  const member = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true }
  });
  if (!member) {
    throw new MobileApiError(404, "USER_NOT_FOUND", "The member was not found.");
  }

  const checkInTime = input.status === "PRESENT" ? new Date() : null;
  return prisma.attendance.upsert({
    where: { meetingId_userId: { meetingId, userId: input.userId } },
    update: { status: input.status, checkInTime },
    create: {
      meetingId,
      userId: input.userId,
      status: input.status,
      checkInTime
    }
  });
}

export async function saveMobileVolunteer(meetingId: string, input: VolunteerInput) {
  await requireMeetingRecord(meetingId);
  if (input.userId) {
    const member = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true }
    });
    if (!member) {
      throw new MobileApiError(404, "USER_NOT_FOUND", "The member was not found.");
    }
  }

  return prisma.volunteerAssignment.upsert({
    where: { meetingId_role: { meetingId, role: input.role } },
    update: { userId: input.userId, notes: input.notes },
    create: {
      meetingId,
      userId: input.userId,
      role: input.role,
      notes: input.notes
    },
    include: { user: { select: { id: true, name: true } } }
  });
}

export async function listMobileAnnouncements() {
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
    include: { createdBy: { select: { id: true, name: true } } }
  });
  return { announcements };
}

export async function createMobileAnnouncement(user: MobileUser, input: AnnouncementInput) {
  return prisma.announcement.create({
    data: {
      ...input,
      pinned: input.pinned ?? false,
      createdById: user.id
    },
    include: { createdBy: { select: { id: true, name: true } } }
  });
}

export async function listMobileResources(query?: string) {
  const q = query?.trim();
  const [resources, meetings] = await Promise.all([
    prisma.studyResource.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { bibleTopic: { contains: q, mode: "insensitive" } }
            ]
          }
        : {},
      orderBy: { createdAt: "desc" },
      include: {
        meeting: { select: { id: true, title: true } },
        createdBy: { select: { id: true, name: true } }
      }
    }),
    prisma.meeting.findMany({
      orderBy: { date: "desc" },
      select: { id: true, title: true, date: true }
    })
  ]);
  return { resources, meetings, query: q ?? "" };
}

export async function createMobileResource(user: MobileUser, input: ResourceInput) {
  if (input.meetingId) {
    await requireMeetingRecord(input.meetingId);
  }
  return prisma.studyResource.create({
    data: { ...input, createdById: user.id },
    include: {
      meeting: { select: { id: true, title: true } },
      createdBy: { select: { id: true, name: true } }
    }
  });
}

export async function listMobilePrayerRequests(user: MobileUser) {
  const requests = await prisma.prayerRequest.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : { OR: [{ visibility: "PUBLIC" }, { createdById: user.id }] },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true } },
      interactions: { select: { userId: true } }
    }
  });

  return {
    requests: requests.map(({ interactions, ...request }) => ({
      ...request,
      interactionCount: interactions.length,
      prayed: interactions.some((interaction) => interaction.userId === user.id),
      canUpdate: user.role === "ADMIN" || request.createdById === user.id
    }))
  };
}

export async function createMobilePrayerRequest(user: MobileUser, input: PrayerInput) {
  const request = await prisma.prayerRequest.create({
    data: { ...input, createdById: user.id },
    include: { createdBy: { select: { id: true, name: true } } }
  });
  return {
    ...request,
    interactionCount: 0,
    prayed: false,
    canUpdate: true
  };
}

export async function prayForMobileRequest(user: MobileUser, prayerRequestId: string) {
  const request = await prisma.prayerRequest.findUnique({
    where: { id: prayerRequestId },
    select: { id: true, visibility: true }
  });
  if (!request) {
    throw new MobileApiError(404, "PRAYER_REQUEST_NOT_FOUND", "The prayer request was not found.");
  }
  if (request.visibility !== "PUBLIC") {
    throw new MobileApiError(403, "PRIVATE_PRAYER_REQUEST", "Private prayer requests cannot receive interactions.");
  }

  await prisma.prayerInteraction.upsert({
    where: { prayerRequestId_userId: { prayerRequestId, userId: user.id } },
    update: {},
    create: { prayerRequestId, userId: user.id }
  });
  const interactionCount = await prisma.prayerInteraction.count({ where: { prayerRequestId } });
  return { requestId: prayerRequestId, prayed: true as const, interactionCount };
}

export async function updateMobilePrayerStatus(
  user: MobileUser,
  prayerRequestId: string,
  input: PrayerStatusInput
) {
  const request = await prisma.prayerRequest.findUnique({ where: { id: prayerRequestId } });
  if (!request) {
    throw new MobileApiError(404, "PRAYER_REQUEST_NOT_FOUND", "The prayer request was not found.");
  }
  if (user.role !== "ADMIN" && request.createdById !== user.id) {
    throw new MobileApiError(403, "FORBIDDEN", "Only the request owner or an administrator can change its status.");
  }

  return prisma.prayerRequest.update({
    where: { id: prayerRequestId },
    data: { status: input.status },
    include: { createdBy: { select: { id: true, name: true } } }
  });
}

export async function getMobileDiscussions(user: MobileUser, selectedId?: string) {
  const channels = await prisma.discussionChannel.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { messages: true } } }
  });
  const selectedChannel = channels.find((channel) => channel.id === selectedId) ?? channels[0] ?? null;
  const messages = selectedChannel
    ? await prisma.discussionMessage.findMany({
        where: { channelId: selectedChannel.id },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, role: true } } }
      })
    : [];

  return {
    channels,
    selectedChannel,
    messages: messages.map((message) => ({
      ...message,
      canDelete: user.role === "ADMIN"
    }))
  };
}

export async function getMobileChannelMessages(user: MobileUser, channelId: string) {
  const channel = await prisma.discussionChannel.findUnique({
    where: { id: channelId },
    select: { id: true, name: true, description: true }
  });
  if (!channel) {
    throw new MobileApiError(404, "CHANNEL_NOT_FOUND", "The discussion channel was not found.");
  }
  const messages = await prisma.discussionMessage.findMany({
    where: { channelId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, role: true } } }
  });
  return {
    channel,
    messages: messages.map((message) => ({
      ...message,
      canDelete: user.role === "ADMIN"
    }))
  };
}

export async function postMobileMessage(user: MobileUser, channelId: string, input: MessageInput) {
  const channel = await prisma.discussionChannel.findUnique({
    where: { id: channelId },
    select: { id: true }
  });
  if (!channel) {
    throw new MobileApiError(404, "CHANNEL_NOT_FOUND", "The discussion channel was not found.");
  }
  return prisma.discussionMessage.create({
    data: {
      channelId,
      authorId: user.id,
      content: input.content
    },
    include: { author: { select: { id: true, name: true, role: true } } }
  });
}

export async function deleteMobileMessage(messageId: string) {
  const message = await prisma.discussionMessage.findUnique({
    where: { id: messageId },
    select: { id: true }
  });
  if (!message) {
    throw new MobileApiError(404, "MESSAGE_NOT_FOUND", "The discussion message was not found.");
  }
  await prisma.discussionMessage.delete({ where: { id: messageId } });
  return { deleted: true as const, id: messageId };
}

export async function listMobileReading(user: MobileUser) {
  const plans = await prisma.bibleReadingPlan.findMany({
    orderBy: { date: "asc" },
    include: { completions: { select: { userId: true } } }
  });
  const mappedPlans = plans.map(({ completions, ...plan }) => ({
    ...plan,
    completed: completions.some((completion) => completion.userId === user.id)
  }));
  const completedCount = mappedPlans.filter((plan) => plan.completed).length;
  return {
    plans: mappedPlans,
    completedCount,
    totalCount: mappedPlans.length,
    progress: percent(completedCount, mappedPlans.length)
  };
}

export async function createMobileReading(input: ReadingInput) {
  return prisma.bibleReadingPlan.create({ data: input });
}

export async function completeMobileReading(user: MobileUser, planId: string) {
  const plan = await prisma.bibleReadingPlan.findUnique({
    where: { id: planId },
    select: { id: true }
  });
  if (!plan) {
    throw new MobileApiError(404, "READING_PLAN_NOT_FOUND", "The reading plan entry was not found.");
  }
  await prisma.bibleReadingCompletion.upsert({
    where: { planId_userId: { planId, userId: user.id } },
    update: {},
    create: { planId, userId: user.id }
  });
  return { planId, completed: true as const };
}

export async function getMobileDirectory(user: MobileUser) {
  const members = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      area: true,
      role: true,
      phoneVisible: true,
      joinedAt: true
    }
  });

  return {
    profile: user,
    members: members.map((member) => {
      const maySeePhone = member.phoneVisible || user.role === "ADMIN" || member.id === user.id;
      return {
        ...member,
        phone: maySeePhone ? member.phone : null,
        phoneHidden: !maySeePhone
      };
    })
  };
}

export async function updateMobileProfile(user: MobileUser, input: ProfileInput) {
  return prisma.user.update({
    where: { id: user.id },
    data: {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.phone === undefined ? {} : { phone: input.phone ?? "" }),
      ...(input.area === undefined ? {} : { area: input.area ?? "" }),
      ...(input.phoneVisible === undefined ? {} : { phoneVisible: input.phoneVisible })
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      area: true,
      phoneVisible: true,
      joinedAt: true,
      groupId: true
    }
  });
}

export async function getMobileReports() {
  const [meetings, users, prayerCount, readingCount, completionCount] = await Promise.all([
    prisma.meeting.findMany({
      orderBy: { date: "asc" },
      include: { attendance: true, rsvps: true }
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      include: { attendance: true, readingCompletions: true }
    }),
    prisma.prayerInteraction.count(),
    prisma.bibleReadingPlan.count(),
    prisma.bibleReadingCompletion.count()
  ]);

  const attendanceChart = meetings.slice(-8).map((meeting) => ({
    id: meeting.id,
    title: meeting.title,
    name: meeting.title.length > 12 ? `${meeting.title.slice(0, 12)}...` : meeting.title,
    date: meeting.date,
    present: meeting.attendance.filter((row) => row.status === "PRESENT").length,
    absent: meeting.attendance.filter((row) => row.status === "ABSENT").length,
    excused: meeting.attendance.filter((row) => row.status === "EXCUSED").length
  }));
  const latestMeeting = meetings.filter((meeting) => meeting.rsvps.length > 0).at(-1);
  const rsvpSummary = latestMeeting
    ? {
        meeting: { id: latestMeeting.id, title: latestMeeting.title, date: latestMeeting.date },
        data: [
          {
            name: "Attending",
            value: latestMeeting.rsvps.filter((row) => row.status === "ATTENDING").length
          },
          {
            name: "Maybe",
            value: latestMeeting.rsvps.filter((row) => row.status === "MAYBE").length
          },
          {
            name: "Not attending",
            value: latestMeeting.rsvps.filter((row) => row.status === "NOT_ATTENDING").length
          }
        ]
      }
    : null;
  const meetingCount = meetings.length || 1;
  const readingCompletionRate = percent(completionCount, Math.max(readingCount * users.length, 1));

  return {
    metrics: {
      prayerEngagement: prayerCount,
      readingCompletion: readingCompletionRate,
      meetingsTracked: meetings.length
    },
    attendanceChart,
    rsvpSummary,
    members: users.map((member) => {
      const present = member.attendance.filter((row) => row.status === "PRESENT").length;
      const excused = member.attendance.filter((row) => row.status === "EXCUSED").length;
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        present,
        excused,
        attendancePercent: percent(present, meetingCount),
        readingPercent: percent(member.readingCompletions.length, readingCount)
      };
    })
  };
}

