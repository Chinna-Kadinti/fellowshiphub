import { mobileOptions, mobileResult, mobileUserRoute } from "@/lib/mobile-api";
import { mobileCheckIn } from "@/lib/mobile-data";

export const OPTIONS = mobileOptions;

type RouteContext = { params: { id: string } };

export async function POST(request: Request, { params }: RouteContext) {
  return mobileUserRoute(request, async (user) => {
    const attendance = await mobileCheckIn(user, params.id);
    return mobileResult({ attendance });
  });
}

