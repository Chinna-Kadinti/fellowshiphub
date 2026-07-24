import {
  mobileJsonBody,
  mobileOptions,
  mobileResult,
  mobileUserRoute
} from "@/lib/mobile-api";
import { saveMobileVolunteer } from "@/lib/mobile-data";
import { mobileVolunteerSchema } from "@/lib/mobile-validators";

export const OPTIONS = mobileOptions;

type RouteContext = { params: { id: string } };

export async function PUT(request: Request, { params }: RouteContext) {
  return mobileUserRoute(
    request,
    async () => {
      const input = await mobileJsonBody(request, mobileVolunteerSchema);
      const assignment = await saveMobileVolunteer(params.id, input);
      return mobileResult({ assignment });
    },
    { admin: true }
  );
}

export const POST = PUT;
export const PATCH = PUT;

