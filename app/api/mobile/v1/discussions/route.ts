import { mobileOptions, mobileResult, mobileUserRoute } from "@/lib/mobile-api";
import { getMobileDiscussions } from "@/lib/mobile-data";

export const OPTIONS = mobileOptions;

export async function GET(request: Request) {
  return mobileUserRoute(request, async (user) => {
    const channelId = new URL(request.url).searchParams.get("channel") ?? undefined;
    return mobileResult(await getMobileDiscussions(user, channelId));
  });
}

