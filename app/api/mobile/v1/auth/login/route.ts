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
import { mobileLoginSchema } from "@/lib/mobile-validators";

export const OPTIONS = mobileOptions;

export async function POST(request: Request) {
  return mobilePublicRoute(request, async () => {
    const input = await mobileJsonBody(request, mobileLoginSchema);
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        role: true,
        phone: true,
        area: true,
        phoneVisible: true,
        joinedAt: true,
        groupId: true
      }
    });

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new MobileApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    const { passwordHash: _passwordHash, ...safeUser } = user;
    const token = await signSession({
      id: safeUser.id,
      email: safeUser.email,
      name: safeUser.name,
      role: safeUser.role
    });
    return mobileResult({ token, user: safeUser });
  });
}

