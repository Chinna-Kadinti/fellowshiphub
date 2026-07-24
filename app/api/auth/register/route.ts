import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { signSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Check the form and try again." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the form and try again." }, { status: 400 });
  }

  let existing;
  try {
    existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  } catch (error) {
    console.error("Registration failed because the database is unavailable.", error);
    return NextResponse.json({ error: "Database is unavailable. Start PostgreSQL and try again." }, { status: 503 });
  }
  if (existing) {
    return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  let user;
  try {
    const group = await prisma.group.findFirst({ orderBy: { createdAt: "asc" } });
    user = await prisma.user.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        name: parsed.data.name,
        phone: parsed.data.phone,
        area: parsed.data.area,
        phoneVisible: parsed.data.phoneVisible ?? false,
        groupId: group?.id
      }
    });
  } catch (error) {
    console.error("Registration failed while writing to the database.", error);
    return NextResponse.json({ error: "Database is unavailable. Start PostgreSQL and try again." }, { status: 503 });
  }

  const token = await signSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });
  setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
