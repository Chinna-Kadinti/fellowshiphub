import {
  mobileJsonBody,
  mobileOptions,
  mobileResult,
  mobileUserRoute
} from "@/lib/mobile-api";
import { createMobileMeeting, listMobileMeetings } from "@/lib/mobile-data";
import { mobileMeetingSchema } from "@/lib/mobile-validators";

export const OPTIONS = mobileOptions;

export async function GET(request: Request) {
  return mobileUserRoute(request, async (user) =>
    mobileResult(await listMobileMeetings(user))
  );
}

export async function POST(request: Request) {
  return mobileUserRoute(
    request,
    async () => {
      const input = await mobileJsonBody(request, mobileMeetingSchema);
      const meeting = await createMobileMeeting(input);
      return mobileResult({ meeting }, 201);
    },
    { admin: true }
  );
}

