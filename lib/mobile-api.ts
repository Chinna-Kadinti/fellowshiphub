import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { verifySessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_MOBILE_ORIGINS = [
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
  "ionic://localhost"
];

export type MobileUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MEMBER";
  phone: string | null;
  area: string | null;
  phoneVisible: boolean;
  joinedAt: Date;
  groupId: string | null;
};

export type MobileRouteResult<T> = {
  data: T;
  status?: number;
};

export class MobileApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "MobileApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function configuredOrigins() {
  const configured = (process.env.MOBILE_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([...DEFAULT_MOBILE_ORIGINS, ...configured]);
}

function isOriginAllowed(origin: string | null) {
  if (!origin) return true;
  const origins = configuredOrigins();
  return origins.has("*") || origins.has(origin);
}

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  const headers = new Headers({
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff"
  });

  if (origin && isOriginAllowed(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  return headers;
}

function assertOriginAllowed(request: Request) {
  if (!isOriginAllowed(request.headers.get("origin"))) {
    throw new MobileApiError(403, "ORIGIN_NOT_ALLOWED", "This app origin is not allowed.");
  }
}

function successResponse<T>(request: Request, result: MobileRouteResult<T>) {
  return NextResponse.json(
    { data: result.data },
    {
      status: result.status ?? 200,
      headers: corsHeaders(request)
    }
  );
}

function errorResponse(request: Request, error: unknown) {
  if (error instanceof MobileApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === undefined ? {} : { details: error.details })
        }
      },
      { status: error.status, headers: corsHeaders(request) }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "The requested record was not found." } },
        { status: 404, headers: corsHeaders(request) }
      );
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "A record with these details already exists." } },
        { status: 409, headers: corsHeaders(request) }
      );
    }
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: { code: "INVALID_REFERENCE", message: "A related record does not exist." } },
        { status: 400, headers: corsHeaders(request) }
      );
    }
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    (error instanceof Prisma.PrismaClientKnownRequestError && /^P10\d\d$/.test(error.code))
  ) {
    console.error("Mobile API database connection failed.", error);
    return NextResponse.json(
      { error: { code: "SERVICE_UNAVAILABLE", message: "The database is currently unavailable." } },
      { status: 503, headers: corsHeaders(request) }
    );
  }

  console.error("Unhandled mobile API error.", error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } },
    { status: 500, headers: corsHeaders(request) }
  );
}

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

async function authenticatedUser(request: Request): Promise<MobileUser> {
  const session = await verifySessionToken(bearerToken(request));
  if (!session) {
    throw new MobileApiError(401, "UNAUTHENTICATED", "A valid bearer token is required.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
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

  if (!user) {
    throw new MobileApiError(401, "UNAUTHENTICATED", "This account is no longer available.");
  }

  return user;
}

export function mobileResult<T>(data: T, status?: number): MobileRouteResult<T> {
  return { data, status };
}

export async function mobilePublicRoute<T>(
  request: Request,
  handler: () => Promise<MobileRouteResult<T>>
) {
  try {
    assertOriginAllowed(request);
    return successResponse(request, await handler());
  } catch (error) {
    return errorResponse(request, error);
  }
}

export async function mobileUserRoute<T>(
  request: Request,
  handler: (user: MobileUser) => Promise<MobileRouteResult<T>>,
  options: { admin?: boolean } = {}
) {
  try {
    assertOriginAllowed(request);
    const user = await authenticatedUser(request);
    if (options.admin && user.role !== "ADMIN") {
      throw new MobileApiError(403, "FORBIDDEN", "Administrator access is required.");
    }
    return successResponse(request, await handler(user));
  } catch (error) {
    return errorResponse(request, error);
  }
}

export async function mobileJsonBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new MobileApiError(400, "INVALID_JSON", "The request body must be valid JSON.");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new MobileApiError(
      400,
      "VALIDATION_ERROR",
      "Check the submitted fields and try again.",
      parsed.error.flatten()
    );
  }
  return parsed.data;
}

export function mobileOptions(request: Request) {
  if (!isOriginAllowed(request.headers.get("origin"))) {
    return NextResponse.json(
      { error: { code: "ORIGIN_NOT_ALLOWED", message: "This app origin is not allowed." } },
      { status: 403, headers: corsHeaders(request) }
    );
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

