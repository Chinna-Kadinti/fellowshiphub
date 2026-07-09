import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "fellowshiphub_session";

const protectedPrefixes = [
  "/dashboard",
  "/meetings",
  "/announcements",
  "/resources",
  "/prayer",
  "/discussions",
  "/reading",
  "/directory",
  "/reports"
];

export function middleware(request: NextRequest) {
  const isProtected = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  const hasCookie = request.cookies.has(COOKIE_NAME);

  if (isProtected && !hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register") && hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons).*)"]
};
