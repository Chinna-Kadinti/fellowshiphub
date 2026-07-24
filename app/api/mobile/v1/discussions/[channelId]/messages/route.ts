import {
  mobileJsonBody,
  mobileOptions,
  mobileResult,
  mobileUserRoute
} from "@/lib/mobile-api";
import {
  getMobileChannelMessages,
  postMobileMessage
} from "@/lib/mobile-data";
import { mobileMessageSchema } from "@/lib/mobile-validators";

export const OPTIONS = mobileOptions;

type RouteContext = { params: { channelId: string } };

export async function GET(request: Request, { params }: RouteContext) {
  return mobileUserRoute(request, async (user) =>
    mobileResult(await getMobileChannelMessages(user, params.channelId))
  );
}

export async function POST(request: Request, { params }: RouteContext) {
  return mobileUserRoute(request, async (user) => {
    const input = await mobileJsonBody(request, mobileMessageSchema);
    const message = await postMobileMessage(user, params.channelId, input);
    return mobileResult({ message: { ...message, canDelete: user.role === "ADMIN" } }, 201);
  });
}

