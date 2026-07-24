import {
  mobileJsonBody,
  mobileOptions,
  mobileResult,
  mobileUserRoute
} from "@/lib/mobile-api";
import { markMobileAttendance } from "@/lib/mobile-data";
import { mobileAttendanceSchema } from "@/lib/mobile-validators";

export const OPTIONS = mobileOptions;

type RouteContext = { params: { id: string } };

export async function PUT(request: Request, { params }: RouteContext) {
  return mobileUserRoute(
    request,
    async () => {
      const input = await mobileJsonBody(request, mobileAttendanceSchema);
      const attendance = await markMobileAttendance(params.id, input);
      return mobileResult({ attendance });
    },
    { admin: true }
  );
}

export const PATCH = PUT;

