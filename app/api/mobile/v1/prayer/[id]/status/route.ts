import {
  mobileJsonBody,
  mobileOptions,
  mobileResult,
  mobileUserRoute
} from "@/lib/mobile-api";
import { updateMobilePrayerStatus } from "@/lib/mobile-data";
import { mobilePrayerStatusSchema } from "@/lib/mobile-validators";

export const OPTIONS = mobileOptions;

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteContext) {
  return mobileUserRoute(request, async (user) => {
    const input = await mobileJsonBody(request, mobilePrayerStatusSchema);
    const prayerRequest = await updateMobilePrayerStatus(user, params.id, input);
    return mobileResult({ request: prayerRequest });
  });
}

export const PUT = PATCH;

