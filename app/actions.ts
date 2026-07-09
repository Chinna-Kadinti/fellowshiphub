"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSessionCookie, requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  announcementSchema,
  meetingSchema,
  messageSchema,
  prayerSchema,
  readingSchema,
  resourceSchema,
  volunteerSchema
} from "@/lib/validators";

function formObject(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  for (const [key, value] of Object.entries(data)) {
    if (value === "") data[key] = undefined as unknown as FormDataEntryValue;
  }
  return data;
}

export async function logoutAction() {
  clearSessionCookie();
  redirect("/login");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: String(formData.get("name") || user.name),
      phone: String(formData.get("phone") || ""),
      area: String(formData.get("area") || ""),
      phoneVisible: formData.get("phoneVisible") === "on"
    }
  });
  revalidatePath("/directory");
  revalidatePath("/dashboard");
}

export async function createMeetingAction(formData: FormData) {
  const user = await requireAdmin();
  const parsed = meetingSchema.parse(formObject(formData));
  const group = await prisma.group.findFirst({ orderBy: { createdAt: "asc" } });

  await prisma.meeting.create({
    data: {
      ...parsed,
      groupId: group?.id,
      latitude: parsed.latitude,
      longitude: parsed.longitude
    }
  });

  revalidatePath("/meetings");
  revalidatePath("/dashboard");
  void user;
}

export async function deleteMeetingAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("meetingId"));
  await prisma.meeting.delete({ where: { id } });
  revalidatePath("/meetings");
  revalidatePath("/dashboard");
}

export async function updateRsvpAction(formData: FormData) {
  const user = await requireUser();
  const meetingId = String(formData.get("meetingId"));
  const status = String(formData.get("status")) as "ATTENDING" | "MAYBE" | "NOT_ATTENDING";

  await prisma.rSVP.upsert({
    where: { meetingId_userId: { meetingId, userId: user.id } },
    update: { status },
    create: { meetingId, userId: user.id, status }
  });

  revalidatePath("/dashboard");
  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath("/meetings");
}

export async function updateArrivalStatusAction(formData: FormData) {
  const user = await requireUser();
  const meetingId = String(formData.get("meetingId"));
  const arrivalStatus = String(formData.get("arrivalStatus")) as "NOT_STARTED" | "ON_THE_WAY" | "REACHED";

  await prisma.rSVP.upsert({
    where: { meetingId_userId: { meetingId, userId: user.id } },
    update: { arrivalStatus },
    create: { meetingId, userId: user.id, status: "ATTENDING", arrivalStatus }
  });

  revalidatePath(`/meetings/${meetingId}`);
}

export async function checkInAction(formData: FormData) {
  const user = await requireUser();
  const meetingId = String(formData.get("meetingId"));
  await prisma.attendance.upsert({
    where: { meetingId_userId: { meetingId, userId: user.id } },
    update: { status: "PRESENT", checkInTime: new Date() },
    create: { meetingId, userId: user.id, status: "PRESENT", checkInTime: new Date() }
  });
  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath("/reports");
}

export async function adminAttendanceAction(formData: FormData) {
  await requireAdmin();
  const meetingId = String(formData.get("meetingId"));
  const userId = String(formData.get("userId"));
  const status = String(formData.get("status")) as "PRESENT" | "ABSENT" | "EXCUSED";

  await prisma.attendance.upsert({
    where: { meetingId_userId: { meetingId, userId } },
    update: { status, checkInTime: status === "PRESENT" ? new Date() : null },
    create: { meetingId, userId, status, checkInTime: status === "PRESENT" ? new Date() : null }
  });
  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath("/reports");
}

export async function createAnnouncementAction(formData: FormData) {
  const user = await requireAdmin();
  const raw = formObject(formData);
  const parsed = announcementSchema.parse({ ...raw, pinned: formData.get("pinned") === "on" });
  await prisma.announcement.create({
    data: {
      ...parsed,
      pinned: Boolean(parsed.pinned),
      createdById: user.id
    }
  });
  revalidatePath("/announcements");
  revalidatePath("/dashboard");
}

export async function createResourceAction(formData: FormData) {
  const user = await requireAdmin();
  const parsed = resourceSchema.parse(formObject(formData));
  await prisma.studyResource.create({
    data: {
      ...parsed,
      createdById: user.id
    }
  });
  revalidatePath("/resources");
}

export async function createPrayerAction(formData: FormData) {
  const user = await requireUser();
  const parsed = prayerSchema.parse(formObject(formData));
  await prisma.prayerRequest.create({
    data: {
      ...parsed,
      createdById: user.id
    }
  });
  revalidatePath("/prayer");
  revalidatePath("/dashboard");
}

export async function prayForRequestAction(formData: FormData) {
  const user = await requireUser();
  const prayerRequestId = String(formData.get("prayerRequestId"));
  await prisma.prayerInteraction.upsert({
    where: { prayerRequestId_userId: { prayerRequestId, userId: user.id } },
    update: {},
    create: { prayerRequestId, userId: user.id }
  });
  revalidatePath("/prayer");
  revalidatePath("/dashboard");
}

export async function updatePrayerStatusAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("prayerRequestId"));
  const request = await prisma.prayerRequest.findUnique({ where: { id } });
  if (!request) return;
  if (user.role !== "ADMIN" && request.createdById !== user.id) return;

  const status = String(formData.get("status")) as "ACTIVE" | "ANSWERED" | "ARCHIVED";
  await prisma.prayerRequest.update({ where: { id }, data: { status } });
  revalidatePath("/prayer");
}

export async function postMessageAction(formData: FormData) {
  const user = await requireUser();
  const parsed = messageSchema.parse(formObject(formData));
  await prisma.discussionMessage.create({
    data: {
      channelId: parsed.channelId,
      authorId: user.id,
      content: parsed.content
    }
  });
  revalidatePath("/discussions");
}

export async function deleteMessageAction(formData: FormData) {
  await requireAdmin();
  await prisma.discussionMessage.delete({ where: { id: String(formData.get("messageId")) } });
  revalidatePath("/discussions");
}

export async function createReadingAction(formData: FormData) {
  await requireAdmin();
  const parsed = readingSchema.parse(formObject(formData));
  await prisma.bibleReadingPlan.create({ data: parsed });
  revalidatePath("/reading");
  revalidatePath("/dashboard");
}

export async function completeReadingAction(formData: FormData) {
  const user = await requireUser();
  const planId = String(formData.get("planId"));
  await prisma.bibleReadingCompletion.upsert({
    where: { planId_userId: { planId, userId: user.id } },
    update: {},
    create: { planId, userId: user.id }
  });
  revalidatePath("/reading");
  revalidatePath("/reports");
}

export async function createVolunteerAction(formData: FormData) {
  await requireAdmin();
  const parsed = volunteerSchema.parse(formObject(formData));
  await prisma.volunteerAssignment.upsert({
    where: { meetingId_role: { meetingId: parsed.meetingId, role: parsed.role } },
    update: { userId: parsed.userId, notes: parsed.notes },
    create: parsed
  });
  revalidatePath(`/meetings/${parsed.meetingId}`);
}
