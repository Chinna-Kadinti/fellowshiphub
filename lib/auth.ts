import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "fellowshiphub_session";
const encoder = new TextEncoder();

function secret() {
  const configuredSecret = process.env.JWT_SECRET;
  if (!configuredSecret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production.");
  }
  return encoder.encode(configuredSecret || "dev-only-fellowshiphub-secret");
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MEMBER";
};

export async function signSession(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySessionToken(token?: string): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.id || !payload.email || !payload.name || !payload.role) return null;
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role === "ADMIN" ? "ADMIN" : "MEMBER"
    };
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function requireUser() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      area: true,
      phoneVisible: true
    }
  });

  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export function setSessionCookie(token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const secureCookie = process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === "true"
    : appUrl.startsWith("https://");

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export { COOKIE_NAME };
