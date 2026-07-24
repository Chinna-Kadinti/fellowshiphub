import bcrypt from "bcryptjs";
import { signSession } from "@/lib/auth";
import {
  MobileApiError,
  mobileJsonBody,
  mobileOptions,
  mobilePublicRoute,
  mobileResult
} from "@/lib/mobile-api";
import { prisma } from "@/lib/prisma";
import { mobileRegisterSchema } from "@/lib/mobile-validators";

export const OPTIONS = mobileOptions;

export async function POST(request: Request) {
  return mobilePublicRoute(request, async () => {
    const input = await mobileJsonBody(request, mobileRegisterSchema);
    const email = input.email.toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    if (existing) {
      throw new MobileApiError(
        409,
        "ACCOUNT_EXISTS",
        "An account already exists for this email."
      );
    }

    const [passwordHash, group] = await Promise.all([
      bcrypt.hash(input.password, 12),
      prisma.group.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } })
    ]);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: input.name,
        phone: input.phone,
        area: input.area,
        phoneVisible: input.phoneVisible ?? false,
        groupId: group?.id
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
    const token = await signSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
    return mobileResult({ token, user }, 201);
  });
}

