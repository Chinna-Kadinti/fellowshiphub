import { mobileOptions, mobileResult, mobileUserRoute } from "@/lib/mobile-api";

export const OPTIONS = mobileOptions;

export async function POST(request: Request) {
  return mobileUserRoute(request, async () => mobileResult({ ok: true }));
}

