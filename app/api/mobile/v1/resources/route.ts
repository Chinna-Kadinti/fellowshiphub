import {
  mobileJsonBody,
  mobileOptions,
  mobileResult,
  mobileUserRoute
} from "@/lib/mobile-api";
import {
  createMobileResource,
  listMobileResources
} from "@/lib/mobile-data";
import { mobileResourceSchema } from "@/lib/mobile-validators";

export const OPTIONS = mobileOptions;

export async function GET(request: Request) {
  return mobileUserRoute(request, async () => {
    const query = new URL(request.url).searchParams.get("q") ?? undefined;
    return mobileResult(await listMobileResources(query));
  });
}

export async function POST(request: Request) {
  return mobileUserRoute(
    request,
    async (user) => {
      const input = await mobileJsonBody(request, mobileResourceSchema);
      const resource = await createMobileResource(user, input);
      return mobileResult({ resource }, 201);
    },
    { admin: true }
  );
}

