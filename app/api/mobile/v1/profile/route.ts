import {
  mobileJsonBody,
  mobileOptions,
  mobileResult,
  mobileUserRoute
} from "@/lib/mobile-api";
import { updateMobileProfile } from "@/lib/mobile-data";
import { mobileProfileSchema } from "@/lib/mobile-validators";

export const OPTIONS = mobileOptions;

export async function GET(request: Request) {
  return mobileUserRoute(request, async (user) => mobileResult({ user }));
}

export async function PATCH(request: Request) {
  return mobileUserRoute(request, async (user) => {
    const input = await mobileJsonBody(request, mobileProfileSchema);
    const updated = await updateMobileProfile(user, input);
    return mobileResult({ user: updated });
  });
}

export const PUT = PATCH;

