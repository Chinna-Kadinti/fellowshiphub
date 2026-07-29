import bcrypt from "bcryptjs";
import { randomBytes, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { signSession, setSessionCookie } from "@/lib/auth";
import { consumeGoogleOAuthCookies, exchangeGoogleCode, publicAppOrigin } from "@/lib/google-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function loginRedirect(request: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${error}`, publicAppOrigin(request)));
}

function statesMatch(received: string | null, expected?: string) {
  if (!received || !expected) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: NextRequest) {
  const { state: expectedState, verifier, redirectUri } = consumeGoogleOAuthCookies();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !verifier || !redirectUri || !statesMatch(state, expectedState)) {
    return loginRedirect(request, "google_invalid_request");
  }

  try {
    const profile = await exchangeGoogleCode(code, verifier, redirectUri);
    const email = profile.email.toLowerCase();
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: profile.sub }, { email }] }
    });

    if (user?.googleId && user.googleId !== profile.sub) {
      return loginRedirect(request, "google_account_conflict");
    }

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.sub }
      });
    } else {
      const [passwordHash, group] = await Promise.all([
        bcrypt.hash(randomBytes(32).toString("hex"), 12),
        prisma.group.findFirst({ orderBy: { createdAt: "asc" } })
      ]);
      user = await prisma.user.create({
        data: {
          googleId: profile.sub,
          email,
          name: profile.name,
          passwordHash,
          groupId: group?.id
        }
      });
    }

    const token = await signSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
    setSessionCookie(token);
    return NextResponse.redirect(new URL("/dashboard", publicAppOrigin(request)));
  } catch (error) {
    console.error("Google sign-in failed.", error);
    return loginRedirect(request, "google_failed");
  }
}
