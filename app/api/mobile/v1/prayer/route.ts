import {
  mobileJsonBody,
  mobileOptions,
  mobileResult,
  mobileUserRoute
} from "@/lib/mobile-api";
import {
  createMobilePrayerRequest,
  listMobilePrayerRequests
} from "@/lib/mobile-data";
import { mobilePrayerSchema } from "@/lib/mobile-validators";

export const OPTIONS = mobileOptions;

export async function GET(request: Request) {
  return mobileUserRoute(request, async (user) =>
    mobileResult(await listMobilePrayerRequests(user))
  );
}

export async function POST(request: Request) {
  return mobileUserRoute(request, async (user) => {
    const input = await mobileJsonBody(request, mobilePrayerSchema);
    const prayerRequest = await createMobilePrayerRequest(user, input);
    return mobileResult({ request: prayerRequest }, 201);
  });
}

