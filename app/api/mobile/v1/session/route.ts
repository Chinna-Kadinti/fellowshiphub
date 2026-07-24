import { mobileOptions, mobileResult, mobileUserRoute } from "@/lib/mobile-api";

export const OPTIONS = mobileOptions;

export async function GET(request: Request) {
  return mobileUserRoute(request, async (user) => mobileResult({ user }));
}

