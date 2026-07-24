import { mobileOptions, mobileResult, mobileUserRoute } from "@/lib/mobile-api";
import { deleteMobileMessage } from "@/lib/mobile-data";

export const OPTIONS = mobileOptions;

type RouteContext = { params: { id: string } };

export async function DELETE(request: Request, { params }: RouteContext) {
  return mobileUserRoute(
    request,
    async () => mobileResult(await deleteMobileMessage(params.id)),
    { admin: true }
  );
}

