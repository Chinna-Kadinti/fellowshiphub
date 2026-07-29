import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const STATE_COOKIE = "fellowshiphub_google_state";
const VERIFIER_COOKIE = "fellowshiphub_google_verifier";
const REDIRECT_URI_COOKIE = "fellowshiphub_google_redirect_uri";
const OAUTH_COOKIE_MAX_AGE = 10 * 60;

function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google authentication is not configured.");
  }

  return { clientId, clientSecret };
}

function requestOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();

  if (forwardedHost) {
    return `${forwardedProto || request.nextUrl.protocol.replace(":", "")}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}

export function publicAppOrigin(request: NextRequest) {
  const configuredUrl = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  return configuredUrl ? new URL(configuredUrl).origin : requestOrigin(request);
}

export function googleRedirectUri(request: NextRequest) {
  return new URL("/api/auth/google/callback", publicAppOrigin(request)).toString();
}

export function createGoogleAuthorization(request: NextRequest) {
  const { clientId } = googleConfig();
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const redirectUri = googleRedirectUri(request);
  const secure = redirectUri.startsWith("https://");
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE
  };

  cookies().set(STATE_COOKIE, state, cookieOptions);
  cookies().set(VERIFIER_COOKIE, verifier, cookieOptions);
  cookies().set(REDIRECT_URI_COOKIE, redirectUri, cookieOptions);

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");

  return url;
}

export function consumeGoogleOAuthCookies() {
  const cookieStore = cookies();
  const state = cookieStore.get(STATE_COOKIE)?.value;
  const verifier = cookieStore.get(VERIFIER_COOKIE)?.value;
  const redirectUri = cookieStore.get(REDIRECT_URI_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);
  cookieStore.delete(VERIFIER_COOKIE);
  cookieStore.delete(REDIRECT_URI_COOKIE);
  return { state, verifier, redirectUri };
}

type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
};

export async function exchangeGoogleCode(code: string, verifier: string, redirectUri: string): Promise<GoogleProfile> {
  const { clientId, clientSecret } = googleConfig();
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier
    }),
    cache: "no-store"
  });

  if (!tokenResponse.ok) throw new Error("Google rejected the authorization code.");
  const tokens = (await tokenResponse.json()) as { access_token?: string };
  if (!tokens.access_token) throw new Error("Google did not return an access token.");

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    cache: "no-store"
  });
  if (!profileResponse.ok) throw new Error("Google profile lookup failed.");

  const profile = (await profileResponse.json()) as Partial<GoogleProfile>;
  if (!profile.sub || !profile.email || !profile.email_verified || !profile.name) {
    throw new Error("A verified Google email and profile name are required.");
  }

  return profile as GoogleProfile;
}
