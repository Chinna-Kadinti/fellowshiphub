import { mobileOptions, mobileResult, mobileUserRoute } from "@/lib/mobile-api";
import {
  deleteMobileMeeting,
  getMobileMeeting
} from "@/lib/mobile-data";

export const OPTIONS = mobileOptions;

type RouteContext = { params: { id: string } };

export async function GET(request: Request, { params }: RouteContext) {
  return mobileUserRoute(request, async (user) =>
    mobileResult(await getMobileMeeting(user, params.id))
  );
}

export async function DELETE(request: Request, { params }: RouteContext) {
  return mobileUserRoute(
    request,
    async () => mobileResult(await deleteMobileMeeting(params.id)),
    { admin: true }
  );
}

