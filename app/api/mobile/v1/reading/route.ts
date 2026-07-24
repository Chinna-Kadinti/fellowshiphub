import {
  mobileJsonBody,
  mobileOptions,
  mobileResult,
  mobileUserRoute
} from "@/lib/mobile-api";
import {
  createMobileReading,
  listMobileReading
} from "@/lib/mobile-data";
import { mobileReadingSchema } from "@/lib/mobile-validators";

export const OPTIONS = mobileOptions;

export async function GET(request: Request) {
  return mobileUserRoute(request, async (user) =>
    mobileResult(await listMobileReading(user))
  );
}

export async function POST(request: Request) {
  return mobileUserRoute(
    request,
    async () => {
      const input = await mobileJsonBody(request, mobileReadingSchema);
      const plan = await createMobileReading(input);
      return mobileResult({ plan }, 201);
    },
    { admin: true }
  );
}

