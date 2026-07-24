import { mobileOptions, mobileResult, mobileUserRoute } from "@/lib/mobile-api";
import { completeMobileReading } from "@/lib/mobile-data";

export const OPTIONS = mobileOptions;

type RouteContext = { params: { id: string } };

export async function POST(request: Request, { params }: RouteContext) {
  return mobileUserRoute(request, async (user) =>
    mobileResult(await completeMobileReading(user, params.id))
  );
}

