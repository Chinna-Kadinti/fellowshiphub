import { mobileOptions, mobileResult, mobileUserRoute } from "@/lib/mobile-api";
import { getMobileReports } from "@/lib/mobile-data";

export const OPTIONS = mobileOptions;

export async function GET(request: Request) {
  return mobileUserRoute(
    request,
    async () => mobileResult(await getMobileReports()),
    { admin: true }
  );
}

