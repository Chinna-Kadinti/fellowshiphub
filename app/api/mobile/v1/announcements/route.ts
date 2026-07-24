import {
  mobileJsonBody,
  mobileOptions,
  mobileResult,
  mobileUserRoute
} from "@/lib/mobile-api";
import {
  createMobileAnnouncement,
  listMobileAnnouncements
} from "@/lib/mobile-data";
import { mobileAnnouncementSchema } from "@/lib/mobile-validators";

export const OPTIONS = mobileOptions;

export async function GET(request: Request) {
  return mobileUserRoute(request, async () =>
    mobileResult(await listMobileAnnouncements())
  );
}

export async function POST(request: Request) {
  return mobileUserRoute(
    request,
    async (user) => {
      const input = await mobileJsonBody(request, mobileAnnouncementSchema);
      const announcement = await createMobileAnnouncement(user, input);
      return mobileResult({ announcement }, 201);
    },
    { admin: true }
  );
}

