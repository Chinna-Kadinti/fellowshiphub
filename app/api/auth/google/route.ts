import { NextRequest, NextResponse } from "next/server";
import { createGoogleAuthorization, publicAppOrigin } from "@/lib/google-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.redirect(createGoogleAuthorization(request));
  } catch (error) {
    console.error("Google sign-in could not start.", error);
    return NextResponse.redirect(new URL("/login?error=google_not_configured", publicAppOrigin(request)));
  }
}
