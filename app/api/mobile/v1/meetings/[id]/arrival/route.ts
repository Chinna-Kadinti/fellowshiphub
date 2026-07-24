import {
  mobileJsonBody,
  mobileOptions,
  mobileResult,
  mobileUserRoute
} from "@/lib/mobile-api";
import { updateMobileArrival } from "@/lib/mobile-data";
import { mobileArrivalSchema } from "@/lib/mobile-validators";

export const OPTIONS = mobileOptions;

type RouteContext = { params: { id: string } };

export async function PUT(request: Request, { params }: RouteContext) {
  return mobileUserRoute(request, async (user) => {
    const input = await mobileJsonBody(request, mobileArrivalSchema);
    const rsvp = await updateMobileArrival(user, params.id, input);
    return mobileResult({ rsvp });
  });
}

export const PATCH = PUT;

