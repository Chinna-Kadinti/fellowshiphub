import { mobileOptions, mobileResult, mobileUserRoute } from "@/lib/mobile-api";
import { getMobileDashboard } from "@/lib/mobile-data";

export const OPTIONS = mobileOptions;

export async function GET(request: Request) {
  return mobileUserRoute(request, async (user) =>
    mobileResult(await getMobileDashboard(user))
  );
}

