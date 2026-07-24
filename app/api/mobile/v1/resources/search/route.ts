import { mobileOptions, mobileResult, mobileUserRoute } from "@/lib/mobile-api";
import { listMobileResources } from "@/lib/mobile-data";

export const OPTIONS = mobileOptions;

export async function GET(request: Request) {
  return mobileUserRoute(request, async () => {
    const query = new URL(request.url).searchParams.get("q") ?? undefined;
    return mobileResult(await listMobileResources(query));
  });
}

